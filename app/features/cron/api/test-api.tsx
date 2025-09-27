/**
 * 간단한 테스트용 API 엔드포인트
 */

import type { App } from "octokit";
import { type LoaderFunctionArgs, data } from "react-router";
import { getGitHubApp } from "~/core/integrations/github/client";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log('🚀 Test API 호출됨:', request.url);

  try {
    // URL에서 처리 타입 추출
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'installations';
    
    console.log('📋 처리 타입:', type);

    // 환경 변수 확인
    if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_APP_PRIVATE_KEY) {
      throw new Error('GitHub App 환경 변수가 설정되지 않았습니다. GITHUB_APP_ID 또는 GITHUB_APP_PRIVATE_KEY가 누락되었습니다.');
    }

    console.log('✅ 환경 변수 확인 완료');

    // Octokit 인스턴스 생성
    const app = getGitHubApp();
    console.log('✅ Octokit 인스턴스 생성 완료');

    let result: any;

    // 처리 타입에 따른 분기
    switch (type) {
      case 'installations':
        result = await handleInstallations(app);
        break;
      
      case 'repos':
        const installationId = url.searchParams.get('installationId');
        if (!installationId) {
          throw new Error('repos 타입을 사용할 때는 installationId 파라미터가 필요합니다.');
        }
        result = await handleRepositories(app, installationId);
        break;
      
      case 'app-info':
        result = await handleAppInfo(app);
        break;
      
      case 'test':
        result = await handleTest(app);
        break;
      
      default:
        throw new Error(`지원하지 않는 처리 타입입니다: ${type}. 지원 타입: installations, repos, app-info, test`);
    }

    return data({
      status: 'success',
      type,
      timestamp: new Date().toISOString(),
      url: request.url,
      ...result
    });

  } catch (error) {
    console.error('❌ Test API 전체 에러:', error);
    
    return data({
      status: 'error',
      message: error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.',
      timestamp: new Date().toISOString(),
      url: request.url,
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}

// Installations 목록 조회
async function handleInstallations(app: App) {
  try {
    const { data: installs } = await app.octokit.rest.apps.listInstallations();
    console.log("✅ Installations 조회 성공:", installs.length, "개");

    console.log("✅ Installations 조회 성공:", installs.map((i: any) => ({
      id: i.id,
      account: i.account?.login,
      accountType: i.account?.type,
      repos: i.repository_selection,
      createdAt: i.created_at,
      updatedAt: i.updated_at
    })));

    return {
      message: 'Installations 조회가 완료되었습니다.',
      data: {
        installationsCount: installs.length,
        installations: installs.map((i: any) => ({
          id: i.id,
          account: i.account?.login,
          accountType: i.account?.type,
          repos: i.repository_selection,
          createdAt: i.created_at,
          updatedAt: i.updated_at
        }))
      }
    };
  } catch (error) {
    console.error('❌ Installations 조회 에러:', error);
    throw new Error(`Installations 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 에러'}`);
  }
}

// 특정 Installation의 Repository 목록 조회
async function handleRepositories(app: any, installationId: string) {
  try {
    const { data: repos } = await app.octokit.rest.apps.listReposAccessibleToInstallation({
      installation_id: parseInt(installationId)
    });
    
    // repos 구조 확인 및 안전한 접근
    const repoList = repos.repositories || repos || [];
    console.log("✅ Repositories 조회 성공:", repoList.length, "개");
    
    return {
      message: `Installation ${installationId}의 Repository 조회가 완료되었습니다.`,
      data: {
        installationId: parseInt(installationId),
        repositoryCount: repoList.length,
        repositories: repoList.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          url: repo.html_url,
          language: repo.language,
          updatedAt: repo.updated_at
        }))
      }
    };
  } catch (error) {
    console.error('❌ Repositories 조회 에러:', error);
    throw new Error(`Repositories 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 에러'}`);
  }
}

// App 정보 조회
async function handleAppInfo(app: any) {
  try {
    
    // 1) 앱 정보
    const appInfo = await app.octokit.request("GET /app");
    console.log("App:", appInfo.data.slug, "id:", appInfo.data.id);
    
    // 2) 설치 목록
    const installs = await app.octokit.request("GET /app/installations");
    console.log("Installations:", installs.data.map((i: any) => ({
      id: i.id,
      account: i.account?.login,
      accountId: i.account?.id,
      accountType: i.account?.type,
      accountAvatarUrl: i.account?.avatar_url,
      accountUrl: i.account?.html_url,
      repos: i.repository_selection,
      permissions: i.permissions,
      createdAt: i.created_at,
      updatedAt: i.updated_at
    })));
    
    // 3) 설치 선택(환경변수 우선)
    const installationId = installs.data[0]?.id;
    if (!installationId) throw new Error("installation_id 없음: 앱을 설치했는지 확인하세요.");
    
    const insOcto = await app.getInstallationOctokit(installationId);

    // 4) 이 설치가 접근 가능한 레포 샘플 출력
    const repos = await insOcto.paginate(
      insOcto.rest.apps.listReposAccessibleToInstallation,
      { per_page: 100 }
    );
    //console.log("Repos:", repos);
    console.log("Repos structure:", Object.keys(repos));
    
    // repos가 배열인지 확인하고 처리
    const repoList = Array.isArray(repos) ? repos : (repos.repositories || repos.data || []);
    console.log("Repos(sample):", repoList.slice(0, 5).map((r: any) => `${r.owner?.login || 'unknown'}/${r.name || 'unknown'}`));
    
    return {
      message: 'GitHub App 정보 조회가 완료되었습니다.',
      data: {
        id: appInfo.id,
        name: appInfo.name,
        description: appInfo.description,
        owner: appInfo.owner?.login,
        installationsCount: appInfo.installations_count,
        createdAt: appInfo.created_at,
        updatedAt: appInfo.updated_at
      }
    };
  } catch (error) {
    console.error('❌ App 정보 조회 에러:', error);
    throw new Error(`App 정보 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 에러'}`);
  }
}

// 테스트용 간단한 응답
async function handleTest(app: any) {
  console.log("✅ 테스트 처리 완료");
  
  return {
    message: 'GitHub App 연결 테스트가 성공했습니다!',
    data: {
      appId: process.env.GITHUB_APP_ID,
      hasPrivateKey: !!process.env.GITHUB_APP_PRIVATE_KEY,
      timestamp: new Date().toISOString()
    }
  };
}
