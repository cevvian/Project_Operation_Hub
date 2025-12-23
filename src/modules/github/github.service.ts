import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GithubService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async createRepo(repoName: string, isPrivate: boolean, userId: string, description?: string) {
    const { token, name: owner } = await this.getGitHubTokenAndUsername(userId);
    const octokit = new Octokit({ auth: token });

    // Define a simpler type that includes only the properties we need.
    type RepoInfo = {
      default_branch: string;
      [key: string]: any; // Allow other properties
    };
    let repoDetails: RepoInfo;
    let createdInThisRun = false;

    try {
      const { data: existingRepo } = await octokit.repos.get({ owner, repo: repoName });
      if (existingRepo.size > 0) {
        throw new AppException(ErrorCode.REPO_EXISTED);
      }
      console.log(`Repo '${repoName}' exists but is empty. Proceeding with initialization.`);
      repoDetails = existingRepo;
    } catch (error) {
      if (error instanceof AppException) throw error;

      if (error.status === 404) {
        try {
          const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
            name: repoName,
            description: description || '',
            private: isPrivate,
            auto_init: true, // Create an initial commit automatically
          });
          repoDetails = newRepo;
          createdInThisRun = true;
        } catch (creationError) {
          console.error('GitHub API Error on create repo:', creationError.message);
          throw new AppException(ErrorCode.GITHUB_API_FAIL);
        }
      } else {
        console.error('GitHub API Error on get repo:', error.message);
        throw new AppException(ErrorCode.GITHUB_API_FAIL);
      }
    }

    // Step 3: Initialize the repository with template files.
    // This entire block is wrapped in a try...catch for rollback purposes.
    try {
      const templateDir = path.join(__dirname, '..', '..', 'templates');
      const templateFiles = ['Jenkinsfile', 'build.sh', 'Dockerfile', 'deploy.ssh.json', 'README.md'];

      const fileBlobs = await Promise.all(
        templateFiles.map(async (fileName) => {
          const filePath = path.join(templateDir, fileName);
          const content = fs.readFileSync(filePath, 'utf-8');
          const blob = await octokit.git.createBlob({ owner, repo: repoName, content, encoding: 'utf-8' });
          return { path: fileName, mode: '100644' as const, type: 'blob' as const, sha: blob.data.sha };
        }),
      );

      // Get the SHA of the latest commit on the default branch
      const { data: refData } = await octokit.git.getRef({
        owner,
        repo: repoName,
        ref: `heads/${repoDetails.default_branch}`,
      });
      const latestCommitSha = refData.object.sha;

      const tree = await octokit.git.createTree({ owner, repo: repoName, tree: fileBlobs });

      // Create a new commit with the new tree and the initial commit as its parent
      const commit = await octokit.git.createCommit({
        owner,
        repo: repoName,
        message: 'Feat: Add project templates',
        tree: tree.data.sha,
        parents: [latestCommitSha],
      });

      await octokit.git.updateRef({
        owner,
        repo: repoName,
        ref: `heads/${repoDetails.default_branch}`,
        sha: commit.data.sha,
      });

      return repoDetails;
    } catch (initializationError) {
      console.error(`Failed to initialize repo '${repoName}'.`, initializationError.message);

      // ROLLBACK: If we created the repo in this run, delete it.
      if (createdInThisRun) {
        console.log(`Rolling back repository creation for '${repoName}'...`);
        try {
          await octokit.repos.delete({ owner, repo: repoName });
          console.log(`Successfully deleted repo '${repoName}' as part of rollback.`);
        } catch (deleteError) {
          console.error(`FATAL: Failed to rollback and delete repo '${repoName}'. Please delete it manually. Error: ${deleteError.message}`);
          console.error(`Hint: This is likely due to the Personal Access Token missing the 'delete_repo' scope.`);
        }
      }

      // Throw a clear error to the user.
      throw new AppException(ErrorCode.REPO_INITIALIZATION_FAIL);
    }
  }


  async createBranch(repo: string, branchName: string, userId: string, from = 'main') {
    const { name: owner, token } = await this.getGitHubTokenAndUsername(userId);

    const octokit = new Octokit({ auth: token });

    // 1) Lấy SHA của branch gốc
    const base = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${from}`,
    });

    const sha = base.data.object.sha;

    // 2) Tạo branch mới
    const newRef = await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha,
    });

    return newRef.data;
  }

  async createPullRequest(repo: string, title: string, head: string, userId: string, base = 'main', body?: string) {
    const { name: owner, token } = await this.getGitHubTokenAndUsername(userId);
    const octokit = new Octokit({ auth: token });

    const pr = await octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body: body ?? '',
    });

    return pr.data;
  }

  async getGitHubTokenAndUsername(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    if (!user.githubToken) {
      throw new AppException(ErrorCode.GITHUB_USER_TOKEN_NOT_FOUND);
    }

    // Dynamic verification: Fetch the actual user associated with the token
    // This ensures that even if the DB has an old/wrong 'githubName', we use the correct one for API calls.
    try {
      const octokit = new Octokit({ auth: user.githubToken });
      const { data: authenticatedUser } = await octokit.users.getAuthenticated();
      return { name: authenticatedUser.login, token: user.githubToken };
    } catch (error) {
      console.error('Failed to verify GitHub token', error);
      throw new AppException(ErrorCode.GITHUB_API_FAIL);
    }
  }

  async checkGithubUsernameExists(username: string, token?: string): Promise<boolean> {
    try {
      const octokit = new Octokit({ auth: token });

      await octokit.rest.users.getByUsername({
        username,
      });

      return true;
    } catch (err) {
      if (err.status === 404) return false;
      throw new AppException(ErrorCode.GITHUB_API_FAIL);
    }
  }

  async deleteRepo(owner: string, repo: string, userId: string) {
    const { token } = await this.getGitHubTokenAndUsername(userId);
    const octokit = new Octokit({ auth: token });

    try {
      await octokit.repos.delete({
        owner,
        repo,
      });
    } catch (error) {
      console.error(`Failed to delete GitHub repo ${owner}/${repo}:`, error.message);
      // We explicitly throw an error so the caller knows the remote delete failed.
      throw new AppException(ErrorCode.GITHUB_API_FAIL);
    }
  }
}
