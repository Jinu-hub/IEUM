import React, { useState } from 'react';
import { 
  LinearButton, 
  LinearCard, 
  LinearCardHeader, 
  LinearCardTitle, 
  LinearCardDescription, 
  LinearCardContent,
  LinearCardFooter,
  LinearInput,
  LinearTextarea,
  LinearBadge,
  LinearAvatar,
  LinearAvatarGroup,
  LinearProgress,
  LinearCircularProgress,
  LinearCarousel,
  LinearCarouselItem,
  LinearImageCard,
  LinearProductCard,
  LinearNavbar,
  LinearFooter,
  LinearHero,
  LinearToggle
} from '~/core/components/linear';
import { Search, Bell, Home, User, Settings, Github, Twitter, Mail, Play, Star, Zap, Users, Award } from 'lucide-react';

export default function SamplesPage() {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [progress, setProgress] = useState(65);
  
  // Toggle states
  const [basicToggle, setBasicToggle] = useState(false);
  const [notificationToggle, setNotificationToggle] = useState(true);
  const [darkModeToggle, setDarkModeToggle] = useState(false);
  const [maintenanceToggle, setMaintenanceToggle] = useState(false);
  const [privacyToggle, setPrivacyToggle] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#0D0E10] dark:text-[#FFFFFF] mb-4">
            Linear Design System
          </h1>
          <p className="text-lg text-[#8B92B5] dark:text-[#6C6F7E] max-w-2xl mx-auto">
            Linear.app의 디자인 시스템을 기반으로 한 재사용 가능한 컴포넌트들을 확인해보세요.
          </p>
        </div>

        {/* Buttons Section */}
        <LinearCard className="mb-8">
          <LinearCardHeader>
            <LinearCardTitle>버튼 컴포넌트</LinearCardTitle>
            <LinearCardDescription>
              다양한 스타일과 크기의 버튼들입니다.
            </LinearCardDescription>
          </LinearCardHeader>
          <LinearCardContent>
            <div className="space-y-6">
              {/* Button Variants */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-3">버튼 변형</h4>
                <div className="flex flex-wrap gap-3">
                  <LinearButton variant="primary">Primary</LinearButton>
                  <LinearButton variant="secondary">Secondary</LinearButton>
                  <LinearButton variant="ghost">Ghost</LinearButton>
                  <LinearButton variant="gradient">Gradient</LinearButton>
                </div>
              </div>
              
              {/* Button Sizes */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-3">버튼 크기</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <LinearButton size="sm">Small</LinearButton>
                  <LinearButton size="md">Medium</LinearButton>
                  <LinearButton size="lg">Large</LinearButton>
                </div>
              </div>
              
              {/* Button States */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-3">버튼 상태</h4>
                <div className="flex flex-wrap gap-3">
                  <LinearButton 
                    leftIcon={<span>🔥</span>}
                  >
                    With Left Icon
                  </LinearButton>
                  <LinearButton 
                    rightIcon={<span>→</span>}
                  >
                    With Right Icon
                  </LinearButton>
                  <LinearButton loading>
                    Loading
                  </LinearButton>
                  <LinearButton disabled>
                    Disabled
                  </LinearButton>
                </div>
              </div>
            </div>
          </LinearCardContent>
        </LinearCard>

        {/* Cards Section */}
        <LinearCard className="mb-8">
          <LinearCardHeader>
            <LinearCardTitle>카드 컴포넌트</LinearCardTitle>
            <LinearCardDescription>
              다양한 스타일의 카드 컴포넌트들입니다.
            </LinearCardDescription>
          </LinearCardHeader>
          <LinearCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <LinearCard variant="default" padding="md" hoverable>
                <LinearCardHeader>
                  <LinearCardTitle as="h4">기본 카드</LinearCardTitle>
                  <LinearCardDescription>기본 스타일의 카드입니다.</LinearCardDescription>
                </LinearCardHeader>
                <LinearCardContent>
                  <p className="text-sm text-[#8B92B5]">카드 내용이 여기에 들어갑니다.</p>
                </LinearCardContent>
              </LinearCard>
              
              <LinearCard variant="elevated" padding="md" hoverable>
                <LinearCardHeader>
                  <LinearCardTitle as="h4">엘리베이티드</LinearCardTitle>
                  <LinearCardDescription>그림자가 강조된 카드입니다.</LinearCardDescription>
                </LinearCardHeader>
                <LinearCardContent>
                  <p className="text-sm text-[#8B92B5]">카드 내용이 여기에 들어갑니다.</p>
                </LinearCardContent>
              </LinearCard>
              
              <LinearCard variant="outlined" padding="md" hoverable>
                <LinearCardHeader>
                  <LinearCardTitle as="h4">아웃라인</LinearCardTitle>
                  <LinearCardDescription>테두리가 강조된 카드입니다.</LinearCardDescription>
                </LinearCardHeader>
                <LinearCardContent>
                  <p className="text-sm text-[#8B92B5]">카드 내용이 여기에 들어갑니다.</p>
                </LinearCardContent>
              </LinearCard>
              
              <LinearCard variant="gradient" padding="md" hoverable>
                <LinearCardHeader>
                  <LinearCardTitle as="h4" className="text-white">그라디언트</LinearCardTitle>
                  <LinearCardDescription className="text-white/80">그라디언트 배경의 카드입니다.</LinearCardDescription>
                </LinearCardHeader>
                <LinearCardContent>
                  <p className="text-sm text-white/70">카드 내용이 여기에 들어갑니다.</p>
                </LinearCardContent>
              </LinearCard>
            </div>
          </LinearCardContent>
        </LinearCard>

        {/* Form Inputs Section */}
        <LinearCard className="mb-8">
          <LinearCardHeader>
            <LinearCardTitle>입력 컴포넌트</LinearCardTitle>
            <LinearCardDescription>
              폼 입력을 위한 다양한 컴포넌트들입니다.
            </LinearCardDescription>
          </LinearCardHeader>
          <LinearCardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <LinearInput
                  label="기본 입력"
                  placeholder="이름을 입력하세요"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  helperText="도움말 텍스트입니다."
                />
                
                <LinearInput
                  label="아이콘이 있는 입력"
                  placeholder="이메일을 입력하세요"
                  leftIcon={<span>📧</span>}
                  variant="outlined"
                />
                
                <LinearInput
                  label="에러 상태"
                  placeholder="잘못된 입력"
                  error="이 필드는 필수입니다."
                  variant="filled"
                />
                
                <LinearInput
                  label="비밀번호"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  rightIcon={<span>👁️</span>}
                />
              </div>
              
              <div className="space-y-4">
                <LinearTextarea
                  label="텍스트 영역"
                  placeholder="메시지를 입력하세요..."
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                  helperText="최대 500자까지 입력 가능합니다."
                  rows={4}
                />
                
                <LinearTextarea
                  label="아웃라인 텍스트 영역"
                  placeholder="피드백을 입력하세요..."
                  variant="outlined"
                  resize="none"
                  rows={3}
                />
              </div>
            </div>
          </LinearCardContent>
        </LinearCard>

        {/* Badges and Avatars Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Badges */}
          <LinearCard>
            <LinearCardHeader>
              <LinearCardTitle>배지 컴포넌트</LinearCardTitle>
              <LinearCardDescription>상태나 라벨을 표시하는 배지들입니다.</LinearCardDescription>
            </LinearCardHeader>
            <LinearCardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-3">기본 배지</h4>
                  <div className="flex flex-wrap gap-2">
                    <LinearBadge variant="default">Default</LinearBadge>
                    <LinearBadge variant="success">Success</LinearBadge>
                    <LinearBadge variant="warning">Warning</LinearBadge>
                    <LinearBadge variant="error">Error</LinearBadge>
                    <LinearBadge variant="info">Info</LinearBadge>
                    <LinearBadge variant="secondary">Secondary</LinearBadge>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-3">특수 배지</h4>
                  <div className="flex flex-wrap gap-2">
                    <LinearBadge variant="success" icon={<span>✓</span>}>
                      완료됨
                    </LinearBadge>
                    <LinearBadge 
                      variant="error" 
                      removable 
                      onRemove={() => console.log('Removed!')}
                    >
                      제거 가능
                    </LinearBadge>
                    <LinearBadge variant="outline" size="lg">
                      큰 배지
                    </LinearBadge>
                  </div>
                </div>
              </div>
            </LinearCardContent>
          </LinearCard>

          {/* Avatars */}
          <LinearCard>
            <LinearCardHeader>
              <LinearCardTitle>아바타 컴포넌트</LinearCardTitle>
              <LinearCardDescription>사용자 프로필을 표시하는 아바타들입니다.</LinearCardDescription>
            </LinearCardHeader>
            <LinearCardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-[#0D0E10] mb-3">크기별 아바타</h4>
                  <div className="flex items-center gap-3">
                    <LinearAvatar size="xs" fallback="XS" />
                    <LinearAvatar size="sm" fallback="SM" />
                    <LinearAvatar size="md" fallback="MD" />
                    <LinearAvatar size="lg" fallback="LG" />
                    <LinearAvatar size="xl" fallback="XL" />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-[#0D0E10] mb-3">상태가 있는 아바타</h4>
                  <div className="flex items-center gap-3">
                    <LinearAvatar fallback="ON" status="online" />
                    <LinearAvatar fallback="OFF" status="offline" />
                    <LinearAvatar fallback="AW" status="away" />
                    <LinearAvatar fallback="BS" status="busy" />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-[#0D0E10] mb-3">아바타 그룹</h4>
                  <LinearAvatarGroup max={4}>
                    <LinearAvatar fallback="A" />
                    <LinearAvatar fallback="B" />
                    <LinearAvatar fallback="C" />
                    <LinearAvatar fallback="D" />
                    <LinearAvatar fallback="E" />
                    <LinearAvatar fallback="F" />
                  </LinearAvatarGroup>
                </div>
              </div>
            </LinearCardContent>
          </LinearCard>
        </div>

        {/* Toggle Section */}
        <LinearCard className="mb-8">
          <LinearCardHeader>
            <LinearCardTitle>토글 컴포넌트</LinearCardTitle>
            <LinearCardDescription>
              설정이나 상태를 온/오프로 전환하는 토글 스위치입니다.
            </LinearCardDescription>
          </LinearCardHeader>
          <LinearCardContent>
            <div className="space-y-8">
              {/* Basic Toggles */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">기본 토글</h4>
                <div className="space-y-4">
                  <LinearToggle
                    checked={basicToggle}
                    onChange={setBasicToggle}
                    label="기본 토글"
                  />
                  
                  <LinearToggle
                    checked={notificationToggle}
                    onChange={setNotificationToggle}
                    label="알림 받기"
                    labelPosition="left"
                  />
                  
                  <LinearToggle
                    checked={false}
                    disabled
                    label="비활성화됨"
                  />
                </div>
              </div>

              {/* Toggle Sizes */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">크기별 토글</h4>
                <div className="flex items-center gap-6">
                  <LinearToggle
                    size="sm"
                    checked={basicToggle}
                    onChange={setBasicToggle}
                    label="Small"
                  />
                  
                  <LinearToggle
                    size="md"
                    checked={notificationToggle}
                    onChange={setNotificationToggle}
                    label="Medium"
                  />
                  
                  <LinearToggle
                    size="lg"
                    checked={darkModeToggle}
                    onChange={setDarkModeToggle}
                    label="Large"
                  />
                </div>
              </div>

              {/* Toggle Variants */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">변형별 토글</h4>
                <div className="space-y-4">
                  <LinearToggle
                    variant="default"
                    checked={basicToggle}
                    onChange={setBasicToggle}
                    label="기본 (Default)"
                  />
                  
                  <LinearToggle
                    variant="success"
                    checked={notificationToggle}
                    onChange={setNotificationToggle}
                    label="성공 (Success)"
                  />
                  
                  <LinearToggle
                    variant="warning"
                    checked={darkModeToggle}
                    onChange={setDarkModeToggle}
                    label="경고 (Warning)"
                  />
                  
                  <LinearToggle
                    variant="error"
                    checked={maintenanceToggle}
                    onChange={setMaintenanceToggle}
                    label="에러 (Error)"
                  />
                </div>
              </div>

              {/* Real-world Examples */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">실제 사용 예시</h4>
                <div className="space-y-6">
                  {/* Settings Group */}
                  <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg p-4">
                    <h5 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-3">개인정보 설정</h5>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#0D0E10] dark:text-[#FFFFFF]">프로필 공개</p>
                          <p className="text-xs text-[#8B92B5] dark:text-[#6C6F7E]">다른 사용자가 내 프로필을 볼 수 있습니다</p>
                        </div>
                        <LinearToggle
                          checked={privacyToggle}
                          onChange={setPrivacyToggle}
                          variant="success"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#0D0E10] dark:text-[#FFFFFF]">이메일 알림</p>
                          <p className="text-xs text-[#8B92B5] dark:text-[#6C6F7E]">중요한 업데이트를 이메일로 받습니다</p>
                        </div>
                        <LinearToggle
                          checked={notificationToggle}
                          onChange={setNotificationToggle}
                          variant="default"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#0D0E10] dark:text-[#FFFFFF]">다크 모드</p>
                          <p className="text-xs text-[#8B92B5] dark:text-[#6C6F7E]">어두운 테마를 사용합니다</p>
                        </div>
                        <LinearToggle
                          checked={darkModeToggle}
                          onChange={setDarkModeToggle}
                          variant="default"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admin Controls */}
                  <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg p-4">
                    <h5 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-3">시스템 관리</h5>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#0D0E10] dark:text-[#FFFFFF]">유지보수 모드</p>
                          <p className="text-xs text-[#8B92B5] dark:text-[#6C6F7E]">사이트를 유지보수 모드로 전환합니다</p>
                        </div>
                        <LinearToggle
                          checked={maintenanceToggle}
                          onChange={setMaintenanceToggle}
                          variant="warning"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between opacity-50">
                        <div>
                          <p className="text-sm text-[#0D0E10] dark:text-[#FFFFFF]">자동 백업</p>
                          <p className="text-xs text-[#8B92B5] dark:text-[#6C6F7E]">일일 자동 백업을 활성화합니다</p>
                        </div>
                        <LinearToggle
                          checked={true}
                          disabled
                          variant="success"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </LinearCardContent>
        </LinearCard>

        {/* Progress Section */}
        <LinearCard className="mb-8">
          <LinearCardHeader>
            <LinearCardTitle>프로그레스 컴포넌트</LinearCardTitle>
            <LinearCardDescription>
              진행률을 표시하는 프로그레스 바와 원형 프로그레스입니다.
            </LinearCardDescription>
          </LinearCardHeader>
          <LinearCardContent>
            <div className="space-y-8">
              {/* Linear Progress */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">선형 프로그레스</h4>
                <div className="space-y-4">
                  <LinearProgress value={progress} showLabel label="기본 프로그레스" />
                  <LinearProgress value={85} variant="success" showLabel label="성공" />
                  <LinearProgress value={60} variant="warning" showLabel label="경고" />
                  <LinearProgress value={30} variant="error" showLabel label="에러" />
                  <LinearProgress value={75} variant="gradient" showLabel label="그라디언트" />
                  <LinearProgress indeterminate label="로딩 중..." />
                </div>
                
                <div className="mt-4">
                  <LinearButton 
                    size="sm" 
                    variant="secondary"
                    onClick={() => setProgress(Math.random() * 100)}
                  >
                    진행률 변경
                  </LinearButton>
                </div>
              </div>
              
              {/* Circular Progress */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">원형 프로그레스</h4>
                <div className="flex items-center gap-6">
                  <LinearCircularProgress value={progress} showLabel size="sm" />
                  <LinearCircularProgress value={80} showLabel size="md" variant="success" />
                  <LinearCircularProgress value={45} showLabel size="lg" variant="warning" />
                  <LinearCircularProgress indeterminate size="md" variant="gradient" />
                </div>
              </div>
            </div>
          </LinearCardContent>
        </LinearCard>

        {/* Carousel Section */}
        <LinearCard className="mb-8">
          <LinearCardHeader>
            <LinearCardTitle>카루셀 컴포넌트</LinearCardTitle>
            <LinearCardDescription>
              자동 재생, 무한 루프, 반응형을 지원하는 카루셀 컴포넌트입니다.
            </LinearCardDescription>
          </LinearCardHeader>
          <LinearCardContent>
            <div className="space-y-8">
              {/* Basic Carousel */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">기본 카루셀</h4>
                <LinearCarousel
                  autoPlay
                  autoPlayInterval={4000}
                  showDots
                  showArrows
                  className="max-w-2xl"
                >
                  <LinearCarouselItem>
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-64 rounded-lg flex items-center justify-center text-white">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-2">슬라이드 1</h3>
                        <p>첫 번째 슬라이드 내용</p>
                      </div>
                    </div>
                  </LinearCarouselItem>
                  <LinearCarouselItem>
                    <div className="bg-gradient-to-r from-green-500 to-teal-600 h-64 rounded-lg flex items-center justify-center text-white">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-2">슬라이드 2</h3>
                        <p>두 번째 슬라이드 내용</p>
                      </div>
                    </div>
                  </LinearCarouselItem>
                  <LinearCarouselItem>
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 h-64 rounded-lg flex items-center justify-center text-white">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-2">슬라이드 3</h3>
                        <p>세 번째 슬라이드 내용</p>
                      </div>
                    </div>
                  </LinearCarouselItem>
                  <LinearCarouselItem>
                    <div className="bg-gradient-to-r from-pink-500 to-violet-600 h-64 rounded-lg flex items-center justify-center text-white">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-2">슬라이드 4</h3>
                        <p>네 번째 슬라이드 내용</p>
                      </div>
                    </div>
                  </LinearCarouselItem>
                </LinearCarousel>
              </div>

              {/* Multi-slide Carousel */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">멀티 슬라이드 카루셀</h4>
                <LinearCarousel
                  slidesToShow={3}
                  slidesToScroll={1}
                  spaceBetween={16}
                  showDots
                  responsive={[
                    { breakpoint: 768, settings: { slidesToShow: 2 } },
                    { breakpoint: 480, settings: { slidesToShow: 1 } }
                  ]}
                >
                  {Array.from({ length: 8 }, (_, index) => (
                    <LinearCarouselItem key={index}>
                      <LinearCard className="h-32">
                        <LinearCardContent className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-[#5E6AD2] dark:bg-[#7C89F9] rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-2">
                              {index + 1}
                            </div>
                            <p className="text-sm text-[#8B92B5] dark:text-[#6C6F7E]">
                              카드 {index + 1}
                            </p>
                          </div>
                        </LinearCardContent>
                      </LinearCard>
                    </LinearCarouselItem>
                  ))}
                </LinearCarousel>
              </div>
            </div>
          </LinearCardContent>
        </LinearCard>

        {/* Image Cards Section */}
        <LinearCard className="mb-8">
          <LinearCardHeader>
            <LinearCardTitle>이미지 카드 컴포넌트</LinearCardTitle>
            <LinearCardDescription>
              이미지와 함께 사용할 수 있는 다양한 스타일의 카드 컴포넌트들입니다.
            </LinearCardDescription>
          </LinearCardHeader>
          <LinearCardContent>
            <div className="space-y-8">
              {/* Basic Image Cards */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">기본 이미지 카드</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <LinearImageCard
                    image={{
                      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
                      alt: "Mountain landscape",
                      aspectRatio: "video"
                    }}
                    title="아름다운 산 풍경"
                    description="자연의 아름다움을 담은 멋진 산 풍경입니다."
                    hoverable
                  />
                  
                  <LinearImageCard
                    image={{
                      src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
                      alt: "Lake view",
                      aspectRatio: "video"
                    }}
                    title="평화로운 호수"
                    description="고요한 호수와 푸른 하늘의 조화입니다."
                    badge={{ text: "인기", variant: "success" }}
                    hoverable
                  />
                  
                  <LinearImageCard
                    image={{
                      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
                      alt: "Forest path",
                      aspectRatio: "video"
                    }}
                    title="숲속 길"
                    description="신비로운 숲속 길을 따라 걸어보세요."
                    badge={{ text: "신규", variant: "info" }}
                    hoverable
                  />
                </div>
              </div>

              {/* Product Cards */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">상품 카드</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <LinearProductCard
                    image={{
                      src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
                      alt: "Running shoes",
                      aspectRatio: "square"
                    }}
                    title="러닝 스니커즈"
                    description="편안하고 스타일리시한 러닝화"
                    price={{
                      current: "89.99",
                      original: "129.99",
                      currency: "$"
                    }}
                    rating={{
                      value: 4.5,
                      count: 128
                    }}
                    actionButton={{
                      text: "장바구니 담기",
                      onClick: () => console.log("Added to cart"),
                      variant: "primary"
                    }}
                    badge={{ text: "세일", variant: "error" }}
                    hoverable
                  />

                  <LinearProductCard
                    image={{
                      src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
                      alt: "Watch",
                      aspectRatio: "square"
                    }}
                    title="스마트 워치"
                    description="최신 기술이 담긴 스마트 워치"
                    price={{
                      current: "199.99",
                      currency: "$"
                    }}
                    rating={{
                      value: 4.8,
                      count: 89
                    }}
                    actionButton={{
                      text: "구매하기",
                      onClick: () => console.log("Purchase"),
                      variant: "primary"
                    }}
                    badge={{ text: "베스트", variant: "warning" }}
                    hoverable
                  />

                  <LinearProductCard
                    image={{
                      src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
                      alt: "Headphones",
                      aspectRatio: "square"
                    }}
                    title="무선 헤드폰"
                    description="프리미엄 사운드 품질"
                    price={{
                      current: "149.99",
                      original: "199.99",
                      currency: "$"
                    }}
                    rating={{
                      value: 4.3,
                      count: 256
                    }}
                    actionButton={{
                      text: "품절",
                      onClick: () => {},
                      variant: "secondary",
                      loading: false
                    }}
                    hoverable
                  />
                </div>
              </div>

              {/* Overlay Cards */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">오버레이 카드</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LinearImageCard
                    image={{
                      src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
                      alt: "Travel destination",
                      aspectRatio: "video"
                    }}
                    title="여행지 추천"
                    description="최고의 여행 경험을 선사하는 특별한 장소"
                    overlay
                    overlayContent={
                      <LinearButton variant="secondary" className="bg-white/90 text-black hover:bg-white">
                        자세히 보기
                      </LinearButton>
                    }
                    hoverable
                  />

                  <LinearImageCard
                    image={{
                      src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop",
                      alt: "Adventure",
                      aspectRatio: "video"
                    }}
                    title="모험을 떠나요"
                    description="새로운 경험과 추억을 만들어보세요"
                    overlay
                    overlayContent={
                      <div className="text-center">
                        <LinearButton variant="primary" className="mb-2">
                          지금 시작하기
                        </LinearButton>
                        <p className="text-white/80 text-sm">특별 혜택 제공</p>
                      </div>
                    }
                    badge={{ text: "한정", variant: "error" }}
                    hoverable
                  />
                </div>
              </div>
            </div>
          </LinearCardContent>
        </LinearCard>

        {/* Layout Components Section */}
        <LinearCard className="mb-8">
          <LinearCardHeader>
            <LinearCardTitle>레이아웃 컴포넌트</LinearCardTitle>
            <LinearCardDescription>
              웹사이트의 주요 레이아웃을 구성하는 Navbar, Hero, Footer 컴포넌트들입니다.
            </LinearCardDescription>
          </LinearCardHeader>
          <LinearCardContent>
            <div className="space-y-12">
              {/* Navbar Section */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">네비게이션 바</h4>
                <div className="space-y-6">
                  {/* Default Navbar */}
                  <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg overflow-hidden">
                    <LinearNavbar
                      brand={{
                        name: "Linear",
                        href: "/"
                      }}
                      navigation={[
                        { label: "홈", href: "/", current: true },
                        { label: "제품", href: "/products" },
                        { 
                          label: "회사", 
                          href: "/company",
                          children: [
                            { label: "소개", href: "/about", description: "회사 소개" },
                            { label: "팀", href: "/team", description: "팀 멤버들" },
                            { label: "채용", href: "/careers", description: "함께 일할 동료를 찾습니다" }
                          ]
                        },
                        { label: "블로그", href: "/blog" }
                      ]}
                      actions={{
                        search: true,
                        notifications: { count: 3 },
                        user: {
                          name: "홍길동",
                          email: "hong@example.com",
                          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
                          menu: [
                            { label: "프로필", href: "/profile" },
                            { label: "설정", href: "/settings" },
                            { label: "로그아웃", href: "/logout" }
                          ]
                        }
                      }}
                    />
                  </div>

                  {/* Transparent Navbar */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
                    <LinearNavbar
                      variant="transparent"
                      brand={{
                        name: "Linear",
                        href: "/"
                      }}
                      navigation={[
                        { label: "홈", href: "/", current: true },
                        { label: "제품", href: "/products" },
                        { label: "가격", href: "/pricing" },
                        { label: "문의", href: "/contact" }
                      ]}
                      actions={{
                        cta: {
                          label: "시작하기",
                          variant: "secondary"
                        }
                      }}
                      className="text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Hero Section */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">히어로 섹션</h4>
                <div className="space-y-8">
                  {/* Centered Hero */}
                  <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg overflow-hidden">
                    <LinearHero
                      variant="centered"
                      size="md"
                      badge={{
                        text: "✨ 새로운 기능 출시",
                        variant: "info"
                      }}
                      title="Linear Design System으로 더 빠르게 개발하세요"
                      subtitle="최고의 사용자 경험을 위한 컴포넌트"
                      description="Linear.app의 디자인 시스템을 기반으로 한 재사용 가능한 React 컴포넌트들로 프로젝트를 빠르게 구축해보세요."
                      actions={{
                        primary: {
                          label: "지금 시작하기",
                          variant: "primary"
                        },
                        secondary: {
                          label: "데모 보기",
                          variant: "secondary",
                          icon: <Play className="w-4 h-4" />
                        }
                      }}
                      features={[
                        { icon: <Zap className="w-4 h-4" />, text: "빠른 개발" },
                        { icon: <Star className="w-4 h-4" />, text: "최고 품질" },
                        { icon: <Users className="w-4 h-4" />, text: "팀 협업" }
                      ]}
                      social={{
                        avatars: [
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
                          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
                        ],
                        count: "1,000+ 개발자",
                        text: "이미 사용하고 있습니다"
                      }}
                    />
                  </div>

                  {/* Split Hero */}
                  <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg overflow-hidden">
                    <LinearHero
                      variant="split"
                      size="lg"
                      badge={{
                        text: "🚀 Beta",
                        variant: "warning"
                      }}
                      title="개발자를 위한 완벽한 도구"
                      subtitle="Linear Design System"
                      description="모던하고 아름다운 웹 애플리케이션을 빠르게 구축할 수 있는 포괄적인 컴포넌트 라이브러리입니다."
                      actions={{
                        primary: {
                          label: "무료로 시작하기",
                          variant: "gradient"
                        },
                        secondary: {
                          label: "문서 보기",
                          variant: "ghost"
                        }
                      }}
                      media={{
                        type: "image",
                        src: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=400&fit=crop",
                        alt: "Dashboard preview"
                      }}
                      features={[
                        { icon: <Award className="w-4 h-4" />, text: "업계 최고 수준" },
                        { icon: <Zap className="w-4 h-4" />, text: "Lightning Fast" },
                        { icon: <Users className="w-4 h-4" />, text: "팀 중심 설계" },
                        { icon: <Star className="w-4 h-4" />, text: "5-Star 평점" }
                      ]}
                    />
                  </div>

                  {/* Minimal Hero */}
                  <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg overflow-hidden">
                    <LinearHero
                      variant="minimal"
                      size="sm"
                      badge={{
                        text: "Coming Soon",
                        variant: "secondary"
                      }}
                      title="Simple. Powerful. Beautiful."
                      description="최소한의 디자인으로 최대한의 임팩트를 만드세요."
                      actions={{
                        primary: {
                          label: "Early Access",
                          variant: "primary"
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div>
                <h4 className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-4">푸터</h4>
                <div className="space-y-6">
                  {/* Rich Footer */}
                  <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg overflow-hidden">
                    <LinearFooter
                      brand={{
                        name: "Linear",
                        description: "Linear.app의 디자인 시스템을 기반으로 한 React 컴포넌트 라이브러리입니다. 빠르고 아름다운 웹 애플리케이션을 구축해보세요."
                      }}
                      links={[
                        {
                          title: "제품",
                          items: [
                            { label: "기능", href: "/features" },
                            { label: "가격", href: "/pricing" },
                            { label: "API", href: "/api" },
                            { label: "문서", href: "/docs", external: true }
                          ]
                        },
                        {
                          title: "회사",
                          items: [
                            { label: "소개", href: "/about" },
                            { label: "팀", href: "/team" },
                            { label: "채용", href: "/careers" },
                            { label: "블로그", href: "/blog" }
                          ]
                        },
                        {
                          title: "지원",
                          items: [
                            { label: "도움말", href: "/help" },
                            { label: "문의", href: "/contact" },
                            { label: "상태", href: "/status", external: true },
                            { label: "커뮤니티", href: "/community" }
                          ]
                        }
                      ]}
                      social={[
                        { platform: "github", href: "https://github.com", label: "GitHub" },
                        { platform: "twitter", href: "https://twitter.com", label: "Twitter" },
                        { platform: "email", href: "mailto:hello@linear.com", label: "Email" }
                      ]}
                      newsletter={{
                        title: "뉴스레터",
                        description: "최신 소식과 업데이트를 이메일로 받아보세요.",
                        placeholder: "이메일 주소",
                        buttonText: "구독하기",
                        onSubmit: (email) => console.log("Newsletter signup:", email)
                      }}
                      legal={{
                        copyright: "© 2024 Linear. All rights reserved.",
                        links: [
                          { label: "개인정보처리방침", href: "/privacy" },
                          { label: "이용약관", href: "/terms" },
                          { label: "쿠키 정책", href: "/cookies" }
                        ]
                      }}
                    />
                  </div>

                  {/* Minimal Footer */}
                  <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg overflow-hidden">
                    <LinearFooter
                      variant="minimal"
                      brand={{
                        name: "Linear"
                      }}
                      social={[
                        { platform: "github", href: "https://github.com" },
                        { platform: "twitter", href: "https://twitter.com" },
                        { platform: "email", href: "mailto:hello@linear.com" }
                      ]}
                      legal={{
                        copyright: "© 2024 Linear. All rights reserved."
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </LinearCardContent>
        </LinearCard>

        {/* Interactive Demo */}
        <LinearCard variant="gradient" className="text-white">
          <LinearCardHeader>
            <LinearCardTitle className="text-white">인터랙티브 데모</LinearCardTitle>
            <LinearCardDescription className="text-white/80">
              컴포넌트들이 실제로 어떻게 작동하는지 확인해보세요.
            </LinearCardDescription>
          </LinearCardHeader>
          <LinearCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-3 text-white">폼 예제</h4>
                <div className="space-y-3">
                  <LinearInput
                    placeholder="프로젝트 이름"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <LinearTextarea
                    placeholder="프로젝트 설명"
                    rows={3}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <LinearButton variant="secondary" className="bg-white text-[#5E6AD2]">
                    프로젝트 생성
                  </LinearButton>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 text-white">팀 정보</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">팀 멤버</span>
                    <LinearAvatarGroup max={3} size="sm">
                      <LinearAvatar fallback="김" />
                      <LinearAvatar fallback="이" />
                      <LinearAvatar fallback="박" />
                      <LinearAvatar fallback="최" />
                    </LinearAvatarGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>프로젝트 진행률</span>
                      <span>78%</span>
                    </div>
                    <LinearProgress value={78} variant="default" className="bg-white/20" />
                  </div>
                  
                  <div className="flex gap-2">
                    <LinearBadge variant="success" className="bg-green-500/20 text-green-100 border-green-400/30">
                      활성
                    </LinearBadge>
                    <LinearBadge variant="info" className="bg-blue-500/20 text-blue-100 border-blue-400/30">
                      우선순위
                    </LinearBadge>
                  </div>
                </div>
              </div>
            </div>
          </LinearCardContent>
        </LinearCard>
      </div>
    </div>
  );
}
