import React, { useEffect, useState } from 'react';
import { redirect, useFetcher, useNavigate, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { 
  LinearCard, 
  LinearCardTitle, 
  LinearCardDescription, 
  LinearCardContent,
  LinearButton,
  LinearBadge,
  PlusIcon,
  LinearInput,
} from '~/core/components/linear';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { Mail, Users, Search, MoreVertical, Edit, Trash2, Copy, Calendar } from 'lucide-react';
import { cn } from '~/core/lib/utils';
import type { Route } from "./+types/mail-list";
import type { MailListData } from '../lib/types';
import { formatDate, formatMemberCount } from '../lib/common';
import makeServerClient from '~/core/lib/supa-client.server';
import { getMailingList, getMailingListMemberCount, getWorkspace } from '../db/queries';
import { deleteMailingList } from '../db/mutations';
import { toast } from 'sonner';

export const meta: Route.MetaFunction = () => {
  return [{ title: `메일 리스트 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }
  const formData = await request.formData();
  const mailingListId = formData.get('mailingListId') as string;
  const workspaceId = formData.get('workspaceId') as string;
  const actionType = formData.get('actionType') as string;
  if (!actionType || 
      (
        actionType !== 'deleteMailingList'
      )) {
    return {
      status: 'error',
      message: 'Action type not found or not valid'
    };
  }
    if (actionType === 'deleteMailingList') {
      try {
        const result = await deleteMailingList(client, { mailingListId, workspaceId });
        return {
          status: 'success', actionType: actionType, result: result, 
            message: 'Mail list deleted success' };
        } catch (error) {
          return {
            status: 'error', actionType: actionType, result: null, 
            message: 'Mail list deleted failed'
          };
        }
    }
};


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }
  const workspace = await getWorkspace(client, { userId: user.id });
  const workspaceId = workspace[0].workspace_id;
  const mailLists = await getMailingList(client, { workspaceId: workspaceId });
  for (const mailList of mailLists) {
    mailList.memberCount = await getMailingListMemberCount(client, { mailingListId: mailList.mailingListId });
  }
  return { workspaceId, mailListsData: mailLists };
};

export default function MailListScreen( { loaderData }: Route.ComponentProps ) {
  const { workspaceId, mailListsData } = loaderData;
  const [mailLists, setMailLists] = useState<MailListData[]>(mailListsData);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const fetcher = useFetcher();

  // 검색 필터링
  const filteredMailLists = mailLists.filter(mailList =>
    mailList.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mailList.description && mailList.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 후처리: fetcher 상태 변화 감지
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.actionType === 'deleteMailingList') {
        if (fetcher.data.status === 'success') {
          toast.success(fetcher.data.message || '메일 리스트가 삭제되었습니다.');
          setMailLists(prev => prev.filter(mailList => mailList.mailingListId !== fetcher.data.result.mailing_list_id));
        } else if (fetcher.data.status === 'error') {
          toast.error(fetcher.data.message || '메일 리스트 삭제에 실패했습니다.');
        }
      }
    }
  }, [fetcher.state, fetcher.data]);

  // 메일 리스트 추가 핸들러
  const handleAddMailList = () => {
    // 새로운 메일 리스트 ID로 멤버 관리 페이지로 이동
    navigate('/settings/mail-list/new');
  };

  // 메일 리스트 카드 클릭 핸들러 (멤버 관리 페이지로 이동)
  const handleMailListCardClick = (mailingListId: string) => {
    navigate(`/settings/mail-list/${mailingListId}`);
  };

  // 메일 리스트 편집 핸들러
  const handleEditMailList = (mailingListId: string) => {
    navigate(`/settings/mail-list/${mailingListId}`);
  };

  // 메일 리스트 복사 핸들러
  const handleCopyMailList = (mailingListId: string) => {
    // TODO: 메일 리스트 복사 기능 구현
    console.log("메일 리스트 복사:", mailingListId);
  };

  // 메일 리스트 삭제 핸들러
  const handleDeleteMailList = (mailingListId: string) => {
    if (confirm("정말로 이 메일 리스트를 삭제하시겠습니까? 모든 멤버 정보가 함께 삭제됩니다.")) {
      const submitFormData = new FormData();
      submitFormData.append('actionType', 'deleteMailingList');
      submitFormData.append('mailingListId', mailingListId);
      submitFormData.append('workspaceId', workspaceId);
      fetcher.submit(submitFormData, { method: 'POST' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 헤더 섹션 */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
              메일 리스트 관리
            </h1>
            <p className="text-lg text-[#8B92B5] dark:text-[#6C6F7E]">
              뉴스레터 발송 대상 리스트를 생성하고 관리하세요.
            </p>
          </div>
          
          <LinearBadge variant="info" size="md">
            {mailLists.length}개의 리스트
          </LinearBadge>
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <LinearInput
              placeholder="메일 리스트 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <LinearButton
            variant="primary"
            leftIcon={<PlusIcon />}
            onClick={handleAddMailList}
          >
            새 리스트 추가
          </LinearButton>
        </div>

        {/* 메일 리스트 그리드 */}
        <div className="grid gap-4">
          {filteredMailLists.length === 0 ? (
            /* 빈 상태 또는 검색 결과 없음 */
            <LinearCard variant="outlined" className="text-center py-12">
              <LinearCardContent>
                {searchTerm ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <LinearCardTitle className="mb-2">검색 결과가 없습니다</LinearCardTitle>
                    <LinearCardDescription className="mb-6">
                      '{searchTerm}'에 대한 메일 리스트를 찾을 수 없습니다.
                    </LinearCardDescription>
                    <LinearButton 
                      variant="secondary" 
                      onClick={() => setSearchTerm('')}
                    >
                      검색 초기화
                    </LinearButton>
                  </>
                ) : (
                  <>
                    <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <LinearCardTitle className="mb-2">메일 리스트가 없습니다</LinearCardTitle>
                    <LinearCardDescription className="mb-6">
                      첫 번째 메일 리스트를 추가해주세요
                    </LinearCardDescription>
                    <LinearButton 
                      variant="primary" 
                      leftIcon={<PlusIcon />}
                      onClick={handleAddMailList}
                    >
                      메일 리스트 추가
                    </LinearButton>
                  </>
                )}
              </LinearCardContent>
            </LinearCard>
          ) : (
            /* 메일 리스트 카드 목록 */
            filteredMailLists.map((mailList) => (
              <LinearCard 
                key={mailList.mailingListId} 
                variant="elevated" 
                hoverable
                className="transition-all duration-200 cursor-pointer"
                onClick={() => handleMailListCardClick(mailList.mailingListId)}
              >
                <LinearCardContent className="p-3">
                  <div className="flex items-center justify-between">
                    {/* 좌측: 메일 리스트 정보 */}
                    <div className="flex items-start space-x-2 flex-1">
                      {/* 아이콘 */}
                      <div className="flex flex-col items-center">
                        <div className="p-1.5 rounded-full bg-primary/10">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                      </div>

                      {/* 메일 리스트 상세 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-base font-semibold text-foreground truncate">
                            {mailList.name}
                          </h3>
                        </div>

                        {/* 설명 */}
                        {mailList.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                            {mailList.description}
                          </p>
                        )}

                        {/* 메타 정보 그리드 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {/* 멤버 수 */}
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">멤버 수:</span>
                              <div className="text-muted-foreground">
                                {(mailList.memberCount || 0).toLocaleString()}명
                              </div>
                            </div>
                          </div>

                          {/* 생성일 */}
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">생성일:</span>
                              <div className="text-muted-foreground">
                                {formatDate(mailList.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 우측: 액션 버튼 */}
                    <div className="flex items-center space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <LinearButton
                            variant="ghost"
                            size="sm"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </LinearButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => handleEditMailList(mailList.mailingListId)}
                            className="flex items-center space-x-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span>편집</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCopyMailList(mailList.mailingListId)}
                            className="flex items-center space-x-2"
                          >
                            <Copy className="h-4 w-4" />
                            <span>복사</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMailList(mailList.mailingListId)}
                            className="flex items-center space-x-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>삭제</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </LinearCardContent>
              </LinearCard>
            ))
          )}
        </div>
      </div>

      {/* 플로팅 추가 버튼 */}
      <button
        onClick={handleAddMailList}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-200",
          "bg-sky-600 text-white hover:bg-sky-700",
          "hover:scale-105 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2",
          "dark:focus:ring-offset-background"
        )}
        title="새 메일 리스트 추가"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
