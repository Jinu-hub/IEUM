import React, { useState, useEffect } from 'react';
import { redirect, useNavigate, useSubmit, useFetcher, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { 
  LinearCard, 
  LinearCardTitle,
  LinearCardDescription,
  LinearCardContent,
  LinearButton,
  LinearBadge,
  LinearInput,
  LinearTextarea,
  PlusIcon,
} from '~/core/components/linear';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/core/components/ui/dialog";
import { 
  ArrowLeft, 
  Mail, 
  Users, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Download,
  Calendar,
  Tag,
  User,
  X,
  Save,
  Upload,
} from 'lucide-react';
import { cn } from '~/core/lib/utils';
import type { Route } from "./+types/mail-list-members";
import type { MailListData, MailListMemberData } from '../lib/types';
import { formatDate, getSourceLabel, getSourceVariant } from '../lib/common';
import makeServerClient from '~/core/lib/supa-client.server';
import { getMailingList, getMailingListMembers, getWorkspace } from '../db/queries';
import { deleteMailingListMember, upsertMailingList, upsertMailingListMember } from '../db/mutations';
import { toast } from 'sonner';
import { mailListUserSchema } from '../lib/constants';
import { parseMetaJson } from '../lib/JsonUtils';

export const meta = ({ params }: { params: { mailListId: string } }) => {
  return [{ title: `메일 리스트 멤버 | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }
  const workspace = await getWorkspace(client, { userId: user.id });
  const workspaceId = workspace[0].workspace_id;
  const mailingListId = params.mailListId;
  if (mailingListId && mailingListId !== 'new') {
    const mailingList = await getMailingList(client, { workspaceId: workspaceId, mailingListId: mailingListId });
    const members = await getMailingListMembers(client, { mailingListId: mailingListId });
    let mailList = mailingList?.[0];
    mailList.memberCount = members.length;
    return { workspaceId, mailingList: mailList, members: members };
  } else {
    return { workspaceId, mailingList: null, members: [] };
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const actionType = formData.get('actionType') as string;
  if (!actionType || 
      (
        actionType !== 'mailListSave' && 
        actionType !== 'mailListMemberSave' &&
        actionType !== 'mailListMemberDelete'
      )) {
    return {
      status: 'error',
      message: 'Action type not found or not valid'
    };
  }

  const mailingListId = formData.get('mailingListId') as string;
  const workspaceId = formData.get('workspaceId') as string;

  if (actionType === 'mailListSave') {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      const result = await upsertMailingList(client, {
        mailingListId, workspaceId, name, description
      });
      return {
        status: 'success', actionType: actionType, isNew: mailingListId === 'new',
        message: 'Mail list save success', result: result
      };
    } catch (error) {
      console.error('mailListSave error', error);
      return {
        status: 'error', actionType: actionType, isNew: mailingListId === 'new',
        message: 'Mail list save failed', result: null
      };
    }

  } else if (actionType === 'mailListMemberSave') {
    const email = formData.get('email') as string;
    const displayName = formData.get('displayName') as string;
    const metaJson = formData.get('metaJson') as string;
    try {
      const result = await upsertMailingListMember(client, {
        mailingListId, email, displayName, metaJson
      });
      return { status: 'success', actionType: actionType, result: result, 
        message: 'Mail list member save success' };
    } catch (error) {
      console.error('mailListMemberSave error', error);
      return { status: 'error', actionType: actionType, result: null, 
        message: 'Mail list member save failed' };
    }
  } else if (actionType === 'mailListMemberDelete') {
    const emailsString = formData.get('emails') as string;
    const emails = emailsString.split(',').map(email => email.trim());
    try {
      const result = await deleteMailingListMember(client, { mailingListId, emails });
      return { status: 'success', actionType: actionType, result: result, 
        message: 'Mail list member delete success' };
    } catch (error) {
      console.error('mailListMemberDelete error', error);
      return { status: 'error', actionType: actionType, result: null, 
        message: 'Mail list member delete failed' };
    }
  }
};

export default function MailListMembersScreen( { loaderData }: Route.ComponentProps ) {
  const { workspaceId, mailingList, members: initialMembers } = loaderData;
  
  const navigate = useNavigate();
  const isNew = mailingList === null;
  const fetcher = useFetcher();
  
  // 상태
  const [mailList, setMailList] = useState<MailListData | null>(mailingList || null);
  const [members, setMembers] = useState<MailListMemberData[]>(initialMembers || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberName, setMemberName] = useState('');
  const [emailError, setEmailError] = useState('');
  const [editingMember, setEditingMember] = useState<MailListMemberData | null>(null);
  
  // 편집 상태
  const [isEditing, setIsEditing] = useState(isNew);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

  // 데이터 로드
  useEffect(() => {
    if (isNew) {
      // 새 메일 리스트 생성 모드
      const newMailList: MailListData = {
        mailingListId: 'new',
        workspaceId: workspaceId,
        name: '',
        description: '',
        createdAt: new Date().toISOString(),
        memberCount: 0
      };
      setMailList(newMailList);
      setEditingName('');
      setEditingDescription('');
      setMembers([]);
    } else {
      if (mailingList) {
        setMailList(mailingList);
        setEditingName(mailingList.name);
        setEditingDescription(mailingList.description || '');
        setMembers(members);
      }
    }
  }, [mailingList, isNew]);

  // 후처리: fetcher 상태 변화 감지
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.actionType === 'mailListSave') {
        // 메일 리스트 정보 저장 처리
        if (fetcher.data.status === 'success') {
          toast.success(fetcher.data.message || '메일 리스트 정보가 저장되었습니다.');
          setIsEditing(false);
          if (fetcher.data.isNew) {
            navigate(`/settings/mail-list/${fetcher.data.result.mailing_list_id}`);
          } else {
            setMailList(prev => prev ? {
              ...prev,
              name: editingName.trim(),
              description: editingDescription.trim()
            } : null);
          }
        } else if (fetcher.data.status === 'error') {
          toast.error(fetcher.data.message || '메일 리스트 저장에 실패했습니다.');
        }
        } else if (fetcher.data.actionType === 'mailListMemberSave') {
          // 멤버 정보 저장 처리
          if (fetcher.data.status === 'success') {
            toast.success(fetcher.data.message || '멤버 정보가 저장되었습니다.');
            
            if (editingMember) {
              // 편집 모드: 기존 멤버 업데이트
              setMembers(prev => prev.map(member => 
                member.email === editingMember.email ? fetcher.data.result : member
              ));
              setIsMemberDialogOpen(false);
              setEditingMember(null);
              setMemberEmail('');
              setMemberName('');
            } else {
              // 추가 모드: 새 멤버 추가
              setMembers(prev => [fetcher.data.result, ...prev]);
              setMemberEmail('');
              setMemberName('');
              setIsMemberDialogOpen(false);
              setMailList(prev => prev ? { ...prev, memberCount: (prev.memberCount || 0) + 1 } : null);
            }
          } else if (fetcher.data.status === 'error') {
            toast.error(fetcher.data.message || '멤버 정보 저장에 실패했습니다.');
          }
        } else if (fetcher.data.actionType === 'mailListMemberDelete') {
        // 멤버 삭제 처리
        if (fetcher.data.status === 'success') {
          toast.success(fetcher.data.message || '멤버 정보가 삭제되었습니다.');
          setSelectedMembers([]);
          setMailList(prev => prev ? { ...prev, memberCount: (prev.memberCount || 0) - fetcher.data.result.length } : null);
          setMembers(prev => prev.filter(member => !fetcher.data.result.some((result: any) => result.email === member.email)));
        } else if (fetcher.data.status === 'error') {
          toast.error(fetcher.data.message || '멤버 정보 삭제에 실패했습니다.');
        }
      }
    }
  }, [fetcher.state, fetcher.data]);

  // 검색 필터링
  const filteredMembers = members.filter(member =>
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.displayName && member.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 뒤로 가기
  const handleGoBack = () => {
    if (isNew && !mailList?.name) {
      // 새 메일 리스트이고 제목이 없으면 바로 돌아가기
      navigate('/settings/mail-list');
    } else if (isEditing) {
      // 편집 중이면 확인 후 돌아가기
      if (confirm('변경사항이 저장되지 않습니다. 계속하시겠습니까?')) {
        navigate('/settings/mail-list');
      }
    } else {
      navigate('/settings/mail-list');
    }
  };

  // 편집 모드 토글
  const handleToggleEdit = () => {
    if (isEditing) {
      // 편집 취소
      if (mailList) {
        setEditingName(mailList.name);
        setEditingDescription(mailList.description || '');
      }
      setIsEditing(false);
    } else {
      // 편집 시작
      setIsEditing(true);
    }
  };

  // 메일 리스트 정보 저장
  const handleSaveMailList = () => {
    if (!editingName.trim()) {
      alert('메일 리스트 이름을 입력해주세요.');
      return;
    }

    const submitFormData = new FormData();
    submitFormData.append('actionType', 'mailListSave');
    submitFormData.append('mailingListId', isNew ? 'new' : mailList?.mailingListId || '');
    submitFormData.append('workspaceId', workspaceId);
    submitFormData.append('name', editingName.trim());
    submitFormData.append('description', editingDescription.trim());
    fetcher.submit(submitFormData, { method: 'POST' });
  };

  // 멤버 선택 토글
  const toggleMemberSelection = (email: string) => {
    setSelectedMembers(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(member => member.email));
    }
  };

  // 멤버 추가/편집
  const handleRegisterMember = () => {
    if (!mailList) return;
    
    const validationData = {
      actionType: 'mailListMemberSave' as const,
      mailingListId: mailList.mailingListId,
      workspaceId: workspaceId,
      email: memberEmail,
      displayName: memberName || '',
      metaJson: JSON.stringify({ source: 'manual', tags: [] })
    };

    const validationResult = mailListUserSchema.safeParse(validationData);
    if (!validationResult.success) {
      setEmailError(validationResult.error.issues[0].message);
      return;
    }
    const submitFormData = new FormData();
    Object.entries(validationData).forEach(([key, value]) => {
      submitFormData.append(key, value);
    });
    fetcher.submit(submitFormData, { method: 'POST' });
  };

  // 선택된 멤버 삭제
  const handleDeleteSelectedMembers = () => {
    console.log('handleDeleteSelectedMembers', selectedMembers);
    if (selectedMembers.length > 0 && confirm(`선택한 ${selectedMembers.length}명의 멤버를 삭제하시겠습니까?`)) {
      const submitFormData = new FormData();
      submitFormData.append('actionType', 'mailListMemberDelete');
      submitFormData.append('mailingListId', mailList?.mailingListId || '');
      submitFormData.append('emails', selectedMembers.join(','));
      fetcher.submit(submitFormData, { method: 'POST' });
    }
  };

  // 단일 멤버 삭제
  const handleDeleteMember = (email: string) => {
    if (confirm("이 멤버를 삭제하시겠습니까?")) {
      const submitFormData = new FormData();
      submitFormData.append('actionType', 'mailListMemberDelete');
      submitFormData.append('mailingListId', mailList?.mailingListId || '');
      submitFormData.append('emails', email);
      fetcher.submit(submitFormData, { method: 'POST' });
    }
  };

  // 멤버 편집 다이얼로그 열기
  const handleEditMember = (member: MailListMemberData) => {
    setEditingMember(member);
    setMemberEmail(member.email);
    setMemberName(member.displayName || '');
    setEmailError('');
    setIsMemberDialogOpen(true);
  };

  // CSV 내보내기
  const handleExportCSV = () => {
    const csvContent = [
      ['이메일', '이름', '가입일', '소스', '태그'],
      ...filteredMembers.map(member => [
        member.email,
        member.displayName || '',
        formatDate(member.createdAt),
        getSourceLabel(member.metaJson.source || ''),
        (member.metaJson.tags || []).join(', ')
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${mailList?.name || 'mail-list'}-members.csv`;
    link.click();
  };

  // CSV 가져오기 TODO
  const handleImportCSV = () => {
    // TODO: CSV 가져오기 기능 구현
    console.log('CSV 가져오기');
  };

  if (!mailList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
        <div className="max-w-4xl mx-auto">
          <LinearCard variant="outlined" className="text-center py-12">
            <LinearCardContent>
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <LinearCardTitle className="mb-2">메일 리스트를 찾을 수 없습니다</LinearCardTitle>
              <LinearCardDescription className="mb-6">
                요청하신 메일 리스트가 존재하지 않습니다.
              </LinearCardDescription>
              <LinearButton 
                variant="primary" 
                leftIcon={<ArrowLeft />}
                onClick={handleGoBack}
              >
                메일 리스트로 돌아가기
              </LinearButton>
            </LinearCardContent>
          </LinearCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 헤더 섹션 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LinearButton
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft />}
                onClick={handleGoBack}
              >
                뒤로
              </LinearButton>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
                  {isNew ? '새 메일 리스트' : '메일 리스트 관리'}
                </h1>
                <p className="text-sm text-[#8B92B5] dark:text-[#6C6F7E]">
                  {isEditing 
                    ? '메일 리스트 정보를 입력하고 멤버를 관리하세요'
                    : '메일 리스트 멤버를 관리하세요'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <LinearBadge variant="info" size="md">
                {members.length}명의 멤버
              </LinearBadge>
            </div>
          </div>

          {/* 메일 리스트 정보 편집 섹션 */}
          <LinearCard variant={isEditing ? "elevated" : "outlined"}>
            <LinearCardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          메일 리스트 이름 *
                        </label>
                        <LinearInput
                          placeholder="예: 기술 뉴스레터"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          설명 (선택사항)
                        </label>
                        <LinearTextarea
                          placeholder="메일 리스트에 대한 간단한 설명을 입력하세요"
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">
                          {mailList.name || '제목 없음'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {mailList.description || '설명이 없습니다'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {isEditing ? (
                    <>
                      <LinearButton
                        variant="secondary"
                        size="sm"
                        onClick={handleToggleEdit}
                      >
                        취소
                      </LinearButton>
                      <LinearButton
                        variant="primary"
                        size="sm"
                        leftIcon={<Save />}
                        onClick={handleSaveMailList}
                        disabled={!editingName.trim()}
                      >
                        저장
                      </LinearButton>
                    </>
                  ) : (
                    <LinearButton
                      variant="secondary"
                      size="sm"
                      leftIcon={<Edit />}
                      onClick={handleToggleEdit}
                    >
                      편집
                    </LinearButton>
                  )}
                </div>
              </div>
            </LinearCardContent>
          </LinearCard>
        </div>

        {/* 액션 바 */}
        <div className="flex items-center justify-between gap-4">
          {/* 좌측: 검색 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <LinearInput
              placeholder="멤버 검색 (이메일 또는 이름)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 우측: 액션 버튼들 */}
          <div className="flex items-center space-x-2">
            <LinearButton
              variant="secondary"
              size="sm"
              leftIcon={<Upload />}
              onClick={handleImportCSV}
              disabled
            >
              CSV 업로드 (준비중)
            </LinearButton>
            <LinearButton
              variant="secondary"
              size="sm"
              leftIcon={<Download />}
              onClick={handleExportCSV}
            >
              CSV 다운로드
            </LinearButton>

            <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
              <DialogTrigger asChild>
                <LinearButton
                  variant="primary"
                  size="sm"
                  leftIcon={<PlusIcon />}
                  disabled={isNew && !mailList?.name}
                >
                  멤버 추가
                </LinearButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingMember ? '멤버 편집' : '새 멤버 추가'}</DialogTitle>
                  <DialogDescription>
                    {isNew && !mailList?.name 
                      ? '메일 리스트 정보를 먼저 저장해주세요.'
                      : editingMember 
                        ? '멤버 정보를 수정합니다.'
                        : '메일 리스트에 새로운 멤버를 추가합니다.'
                    }
                  </DialogDescription>
                </DialogHeader>
                {isNew && !mailList?.name ? (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      멤버를 추가하기 전에 메일 리스트 이름을 입력하고 저장해주세요.
                    </p>
                    <LinearButton
                      variant="primary"
                      onClick={() => setIsMemberDialogOpen(false)}
                    >
                      확인
                    </LinearButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">이메일 *</label>
                      <LinearInput
                        type="email"
                        placeholder="member@example.com"
                        value={memberEmail}
                        onChange={(e) => {
                          setMemberEmail(e.target.value);
                          if (emailError) setEmailError(''); // 입력 시 에러 메시지 초기화
                        }}
                        error={emailError}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">이름 (선택사항)</label>
                      <LinearInput
                        placeholder="홍길동"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <LinearButton
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          setIsMemberDialogOpen(false);
                          setEditingMember(null);
                          setMemberEmail('');
                          setMemberName('');
                          setEmailError('');
                        }}
                      >
                        취소
                      </LinearButton>
                      <LinearButton
                        variant="primary"
                        className="cursor-pointer"
                        onClick={handleRegisterMember}
                        disabled={!memberEmail}
                      >
                        {editingMember ? '저장' : '추가'}
                      </LinearButton>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 멤버 목록 */}
        <div className="space-y-4">
          {filteredMembers.length === 0 ? (
            /* 빈 상태 */
            <LinearCard variant="outlined" className="text-center py-12">
              <LinearCardContent>
                {searchTerm ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <LinearCardTitle className="mb-2">검색 결과가 없습니다</LinearCardTitle>
                    <LinearCardDescription className="mb-6">
                      '{searchTerm}'에 대한 멤버를 찾을 수 없습니다.
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
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <LinearCardTitle className="mb-2">멤버가 없습니다</LinearCardTitle>
                    <LinearCardDescription className="mb-6">
                      첫 번째 멤버를 추가해주세요
                    </LinearCardDescription>
                    <LinearButton 
                      variant="primary" 
                      leftIcon={<PlusIcon />}
                      onClick={() => setIsMemberDialogOpen(true)}
                    >
                      멤버 추가
                    </LinearButton>
                  </>
                )}
              </LinearCardContent>
            </LinearCard>
          ) : (
            <>
              {/* 헤더 (선택 등) */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-muted-foreground"
                  />
                  <span 
                    className="text-sm font-medium cursor-pointer"
                    onClick={toggleSelectAll}
                  >
                    {selectedMembers.length > 0 
                      ? `${selectedMembers.length}명 선택됨` 
                      : `전체 ${filteredMembers.length}명`
                    }
                  </span>
                  {selectedMembers.length > 0 && (
                    <LinearButton
                      variant="secondary"
                      size="sm"
                      leftIcon={<Trash2 />}
                      onClick={handleDeleteSelectedMembers}
                      className="cursor-pointer"
                    >
                      {selectedMembers.length}명 삭제
                    </LinearButton>
                  )}
                </div>
                {selectedMembers.length > 0 && (
                  <LinearButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMembers([])}
                  >
                    <X className="h-4 w-4" />
                  </LinearButton>
                )}
              </div>

              {/* 멤버 카드 목록 */}
              {filteredMembers.map((member) => (
                <LinearCard 
                  key={member.email} 
                  variant={selectedMembers.includes(member.email) ? "outlined" : "default"}
                  className={cn(
                    "transition-all duration-200",
                    selectedMembers.includes(member.email) && "ring-2 ring-primary/20"
                  )}
                >
                  <LinearCardContent className="p-1 px-2">
                    <div className="flex items-center justify-between">
                      {/* 좌측: 선택박스 + 멤버 정보 */}
                      <div className="flex items-center space-x-1 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.email)}
                          onChange={() => toggleMemberSelection(member.email)}
                          className="h-3.5 w-3.5 rounded border-muted-foreground"
                        />
                        
                        {/* 모바일: 세로 레이아웃, 데스크톱: 가로 레이아웃 */}
                        <div className="flex flex-col md:flex-row md:items-center space-y-0.5 md:space-y-0 md:space-x-1.5">
                          {/* 아이콘 */}
                          <div className="flex items-center space-x-1 md:space-x-1.5">
                            <div className="p-0.5 rounded-full bg-primary/10">
                              <User className="h-2.5 w-2.5 text-primary" />
                            </div>
                            
                            {/* 모바일에서만 표시되는 이름과 배지 */}
                            <div className="md:hidden">
                              <div className="flex items-center space-x-1">
                                <h4 className="text-xs font-medium text-foreground">
                                  {member.displayName || member.email.split('@')[0]}
                                </h4>
                                <LinearBadge 
                                  variant={getSourceVariant(parseMetaJson(member.metaJson).source)}
                                  size="sm"
                                >
                                  {getSourceLabel(parseMetaJson(member.metaJson).source)}
                                </LinearBadge>
                              </div>
                            </div>
                          </div>
                          
                          {/* 데스크톱: 가로 레이아웃 */}
                          <div className="hidden md:flex md:items-center md:space-x-8 md:flex-1">
                            <div className="min-w-0">
                              <h4 className="text-xs font-medium text-foreground truncate">
                                {member.displayName || member.email.split('@')[0]}
                              </h4>
                              <div className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </div>
                            </div>
                            
                            <LinearBadge 
                              variant={getSourceVariant(parseMetaJson(member.metaJson).source)}
                              size="sm"
                            >
                              {getSourceLabel(parseMetaJson(member.metaJson).source)}
                            </LinearBadge>
                            
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Calendar className="h-2.5 w-2.5" />
                              <span>{formatDate(member.createdAt)}</span>
                            </div>
                            
                            {parseMetaJson(member.metaJson).tags && parseMetaJson(member.metaJson).tags.length > 0 && (
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Tag className="h-2.5 w-2.5" />
                                <span className="truncate max-w-20">{parseMetaJson(member.metaJson).tags.join(', ')}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* 모바일: 하단 정보 */}
                          <div className="md:hidden">
                            <div className="text-xs text-muted-foreground">
                              {member.email}
                            </div>
                            
                            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-2.5 w-2.5" />
                                <span>{formatDate(member.createdAt)}</span>
                              </div>
                              
                              {parseMetaJson(member.metaJson).tags && parseMetaJson(member.metaJson).tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Tag className="h-2.5 w-2.5" />
                                  <span>{parseMetaJson(member.metaJson).tags.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 우측: 액션 메뉴 */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <LinearButton
                            variant="ghost"
                            size="sm"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </LinearButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem 
                            onClick={() => handleEditMember(member)}
                            className="flex items-center space-x-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span>편집</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMember(member.email)}
                            className="flex items-center space-x-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>삭제</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </LinearCardContent>
                </LinearCard>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
