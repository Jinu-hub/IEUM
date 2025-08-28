import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
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
  Upload, 
  Download,
  Filter,
  Calendar,
  Tag,
  User,
  X,
  Save,
  Check
} from 'lucide-react';
import { cn } from '~/core/lib/utils';
import type { Route } from "./+types/mail-list-members";
import { sampleMailLists, sampleMailListMembers } from '../lib/mockdata';
import type { MailListData, MailListMemberData } from '../lib/types';
import { formatDate, formatMemberCount, getSourceLabel, getSourceVariant } from '../lib/common';

export const meta = ({ params }: { params: { mailListId: string } }) => {
  return [{ title: `메일 리스트 멤버 | ${import.meta.env.VITE_APP_NAME}` }];
};

export default function MailListMembersScreen() {
  const navigate = useNavigate();
  const { mailListId } = useParams();
  const isNew = mailListId === 'new';
  
  // 상태
  const [mailList, setMailList] = useState<MailListData | null>(null);
  const [members, setMembers] = useState<MailListMemberData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  
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
        workspaceId: 'workspace-1',
        name: '',
        description: '',
        createdAt: new Date().toISOString(),
        memberCount: 0
      };
      setMailList(newMailList);
      setEditingName('');
      setEditingDescription('');
      setMembers([]);
    } else if (mailListId) {
      const foundMailList = sampleMailLists.find(list => list.mailingListId === mailListId);
      if (foundMailList) {
        setMailList(foundMailList);
        setEditingName(foundMailList.name);
        setEditingDescription(foundMailList.description || '');
        
        const listMembers = sampleMailListMembers.filter(member => member.mailingListId === mailListId);
        setMembers(listMembers);
      }
    }
  }, [mailListId, isNew]);

  // 새 메일 리스트인 경우 이름 입력 필드에 포커스
  useEffect(() => {
    if (isNew && isEditing) {
      // 약간의 지연 후 포커스 (DOM 렌더링 완료 후)
      setTimeout(() => {
        const nameInput = document.querySelector('input[placeholder="예: 기술 뉴스레터"]') as HTMLInputElement;
        if (nameInput) {
          nameInput.focus();
        }
      }, 100);
    }
  }, [isNew, isEditing]);

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

    if (isNew) {
      // 새 메일 리스트 생성
      const newId = `maillist-${Date.now()}`;
      const newMailList: MailListData = {
        mailingListId: newId,
        workspaceId: 'workspace-1',
        name: editingName.trim(),
        description: editingDescription.trim(),
        createdAt: new Date().toISOString(),
        memberCount: 0
      };
      
      console.log('새 메일 리스트 생성:', newMailList);
      setMailList(newMailList);
      
      // URL을 새로운 ID로 업데이트 (실제로는 navigate 대신 replace 사용)
      navigate(`/settings/mail-list/${newId}`, { replace: true });
    } else {
      // 기존 메일 리스트 수정
      if (mailList) {
        const updatedMailList = {
          ...mailList,
          name: editingName.trim(),
          description: editingDescription.trim()
        };
        setMailList(updatedMailList);
        console.log('메일 리스트 업데이트:', updatedMailList);
      }
    }
    
    setIsEditing(false);
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

  // 새 멤버 추가
  const handleAddMember = () => {
    if (newMemberEmail && mailList) {
      // 새 메일 리스트인 경우 먼저 저장해야 함
      if (isNew && !mailList.name) {
        alert('먼저 메일 리스트 정보를 저장해주세요.');
        return;
      }

      const currentMailListId = mailList.mailingListId;
      const newMember: MailListMemberData = {
        mailingListId: currentMailListId,
        email: newMemberEmail,
        displayName: newMemberName || undefined,
        metaJson: { source: 'manual', tags: [] },
        createdAt: new Date().toISOString()
      };
      
      setMembers(prev => [newMember, ...prev]);
      setNewMemberEmail('');
      setNewMemberName('');
      setIsAddMemberDialogOpen(false);
      
      // 멤버 수 업데이트
      setMailList(prev => prev ? { ...prev, memberCount: (prev.memberCount || 0) + 1 } : null);
    }
  };

  // 선택된 멤버 삭제
  const handleDeleteSelectedMembers = () => {
    if (selectedMembers.length > 0 && confirm(`선택한 ${selectedMembers.length}명의 멤버를 삭제하시겠습니까?`)) {
      setMembers(prev => prev.filter(member => !selectedMembers.includes(member.email)));
      setSelectedMembers([]);
    }
  };

  // 단일 멤버 삭제
  const handleDeleteMember = (email: string) => {
    if (confirm("이 멤버를 삭제하시겠습니까?")) {
      setMembers(prev => prev.filter(member => member.email !== email));
    }
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
            {selectedMembers.length > 0 && (
              <LinearButton
                variant="secondary"
                size="sm"
                leftIcon={<Trash2 />}
                onClick={handleDeleteSelectedMembers}
              >
                {selectedMembers.length}명 삭제
              </LinearButton>
            )}
            
            <LinearButton
              variant="secondary"
              size="sm"
              leftIcon={<Download />}
              onClick={handleExportCSV}
            >
              내보내기
            </LinearButton>

            <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
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
                  <DialogTitle>새 멤버 추가</DialogTitle>
                  <DialogDescription>
                    {isNew && !mailList?.name 
                      ? '메일 리스트 정보를 먼저 저장해주세요.'
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
                      onClick={() => setIsAddMemberDialogOpen(false)}
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
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">이름 (선택사항)</label>
                      <LinearInput
                        placeholder="홍길동"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <LinearButton
                        variant="secondary"
                        onClick={() => setIsAddMemberDialogOpen(false)}
                      >
                        취소
                      </LinearButton>
                      <LinearButton
                        variant="primary"
                        onClick={handleAddMember}
                        disabled={!newMemberEmail}
                      >
                        추가
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
                      onClick={() => setIsAddMemberDialogOpen(true)}
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
                  <span className="text-sm font-medium">
                    {selectedMembers.length > 0 
                      ? `${selectedMembers.length}명 선택됨` 
                      : `전체 ${filteredMembers.length}명`
                    }
                  </span>
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
                  <LinearCardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* 좌측: 선택박스 + 멤버 정보 */}
                      <div className="flex items-center space-x-4 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.email)}
                          onChange={() => toggleMemberSelection(member.email)}
                          className="h-4 w-4 rounded border-muted-foreground"
                        />
                        
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-1">
                              <h4 className="font-medium text-foreground">
                                {member.displayName || member.email.split('@')[0]}
                              </h4>
                              <LinearBadge 
                                variant={getSourceVariant(member.metaJson.source || '')}
                                size="sm"
                              >
                                {getSourceLabel(member.metaJson.source || '')}
                              </LinearBadge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {member.email}
                            </div>
                            
                            {/* 태그 및 메타 정보 */}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(member.createdAt)}</span>
                              </div>
                              
                              {member.metaJson.tags && member.metaJson.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Tag className="h-3 w-3" />
                                  <span>{member.metaJson.tags.join(', ')}</span>
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
                          <DropdownMenuItem className="flex items-center space-x-2">
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
