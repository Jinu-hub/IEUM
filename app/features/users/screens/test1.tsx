import { useState } from 'react';
import { toast } from 'sonner';
import { LinearButton } from '~/core/components/linear';

export default function TestScreen() {
  const [isLoading, setIsLoading] = useState(false);

  // Cron API 테스트 함수
  const handleTestCronAPI = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 /cron/actions API 호출 시작...');
      
      // 올바른 API 경로로 호출
      const response = await fetch('/api/cron/actions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      console.log('✅ /cron/actions API 응답:', data);
      
      if (data.status === 'success') {
        console.log('📊 필터링된 타겟 정보:', {
          totalTargets: data.data.totalTargets,
          scheduledTargets: data.data.scheduledTargets,
          targets: data.data.targets
        });
        
        toast.success(`Cron API 호출 성공! ${data.data.scheduledTargets}개의 타겟이 1시간 이내 실행 예정입니다.`);
      } else {
        console.error('❌ API 호출 실패:', data.error);
        toast.error(`Cron API 호출 실패: ${data.error}`);
      }
      
    } catch (error) {
      console.error('❌ API 호출 중 오류 발생:', error);
      toast.error('Cron API 호출 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestGithubApp = async (type: string = 'installations') => {
    setIsLoading(true);
    try {
      console.log(`🚀 /cron/test API 호출 시작... (type: ${type})`);
      const response = await fetch(`/api/cron/test?type=${type}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      console.log('✅ /cron/test API 응답:', data);
      
      if (data.status === 'success') {
        console.log('📊 GitHub 테스트 결과:', {
          message: data.message,
        });
        
        //toast.success(`GitHub App 테스트 성공! ${data.data.repositories.total}개의 리포지토리를 찾았습니다.`);
      } else {
        console.error('❌ API 호출 실패:', data.error);
        toast.error(`GitHub API 테스트 실패: ${data.error}`);
      }
    }
    catch (error) {
      console.error('❌ API 호출 중 오류 발생:', error);
      toast.error('Cron API 호출 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🧪 테스트 페이지
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            API 테스트 및 개발용 페이지입니다
          </p>
        </div>

        {/* 테스트 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📡 API 테스트
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Cron Actions API 테스트
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  /api/cron/actions 엔드포인트를 호출하여 1시간 이내 실행 예정인 타겟들을 조회합니다
                </p>
              </div>
              <LinearButton
                variant="primary"
                onClick={handleTestCronAPI}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? '테스트 중...' : 'API 테스트'}
              </LinearButton>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Cron Github Test API 테스트
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  /api/cron/test 엔드포인트를 호출하여 GitHub App installations 테스트합니다
                </p>
              </div>
              <LinearButton
                variant="primary"
                onClick={() => handleTestGithubApp('installations')}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? '테스트 중...' : 'API 테스트'}
              </LinearButton>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Cron Github Test API 테스트
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  /api/cron/test 엔드포인트를 호출하여 GitHub App App-Info 테스트합니다
                </p>
              </div>
              <LinearButton
                variant="primary"
                onClick={() => handleTestGithubApp('app-info')}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? '테스트 중...' : 'API 테스트'}
              </LinearButton>
            </div>
          </div>
        </div>

        {/* 사용법 안내 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 사용법
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• "API 테스트" 버튼을 클릭하여 Cron Actions API를 호출합니다</li>
            <li>• "API 테스트" 버튼을 클릭하여 GitHub App 연동을 테스트합니다</li>
            <li>• 브라우저 개발자 도구의 콘솔에서 상세한 로그를 확인할 수 있습니다</li>
            <li>• 성공/실패 메시지는 토스트 알림으로 표시됩니다</li>
            <li>• 응답 데이터는 콘솔에 출력됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
