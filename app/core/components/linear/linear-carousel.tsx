import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '~/core/lib/utils';

export interface LinearCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  infinite?: boolean;
  slidesToShow?: number;
  slidesToScroll?: number;
  spaceBetween?: number;
  responsive?: {
    breakpoint: number;
    settings: {
      slidesToShow?: number;
      slidesToScroll?: number;
    };
  }[];
}

export const LinearCarousel: React.FC<LinearCarouselProps> = ({
  children,
  autoPlay = false,
  autoPlayInterval = 3000,
  showDots = true,
  showArrows = true,
  infinite = true,
  slidesToShow = 1,
  slidesToScroll = 1,
  spaceBetween = 16,
  responsive = [],
  className,
  ...props
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentSlidesToShow, setCurrentSlidesToShow] = useState(slidesToShow);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = children.length;
  const maxIndex = Math.max(0, totalSlides - currentSlidesToShow);

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newSlidesToShow = slidesToShow;

      for (const bp of responsive) {
        if (width <= bp.breakpoint) {
          newSlidesToShow = bp.settings.slidesToShow || slidesToShow;
          break;
        }
      }

      setCurrentSlidesToShow(newSlidesToShow);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [slidesToShow, responsive]);

  // Auto play functionality
  useEffect(() => {
    if (autoPlay && totalSlides > currentSlidesToShow) {
      autoPlayRef.current = setInterval(() => {
        nextSlide();
      }, autoPlayInterval);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, currentIndex, totalSlides, currentSlidesToShow]);

  const nextSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => {
      if (infinite) {
        return prev >= maxIndex ? 0 : prev + slidesToScroll;
      }
      return Math.min(prev + slidesToScroll, maxIndex);
    });
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => {
      if (infinite) {
        return prev <= 0 ? maxIndex : prev - slidesToScroll;
      }
      return Math.max(prev - slidesToScroll, 0);
    });
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(Math.min(index, maxIndex));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const slideWidth = 100 / currentSlidesToShow;
  const translateX = -(currentIndex * slideWidth);

  return (
    <div
      ref={carouselRef}
      className={cn("relative overflow-hidden rounded-xl", className)}
      {...props}
    >
      {/* Carousel Content */}
      <div className="relative">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(${translateX}%)`,
            gap: `${spaceBetween}px`,
          }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{ 
                width: `calc(${slideWidth}% - ${spaceBetween * (currentSlidesToShow - 1) / currentSlidesToShow}px)`,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && totalSlides > currentSlidesToShow && (
        <>
          <button
            onClick={prevSlide}
            disabled={!infinite && currentIndex === 0}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-10",
              "w-10 h-10 rounded-full bg-white/80 dark:bg-[#1A1B1E]/80",
              "border border-[#E1E4E8] dark:border-[#2C2D30]",
              "flex items-center justify-center",
              "transition-all duration-200",
              "hover:bg-white dark:hover:bg-[#1A1B1E]",
              "hover:shadow-lg hover:scale-105",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              "backdrop-blur-sm"
            )}
          >
            <ChevronLeft className="w-5 h-5 text-[#0D0E10] dark:text-[#FFFFFF]" />
          </button>

          <button
            onClick={nextSlide}
            disabled={!infinite && currentIndex >= maxIndex}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-10",
              "w-10 h-10 rounded-full bg-white/80 dark:bg-[#1A1B1E]/80",
              "border border-[#E1E4E8] dark:border-[#2C2D30]",
              "flex items-center justify-center",
              "transition-all duration-200",
              "hover:bg-white dark:hover:bg-[#1A1B1E]",
              "hover:shadow-lg hover:scale-105",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              "backdrop-blur-sm"
            )}
          >
            <ChevronRight className="w-5 h-5 text-[#0D0E10] dark:text-[#FFFFFF]" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && totalSlides > currentSlidesToShow && (
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: Math.max(0, totalSlides - currentSlidesToShow + 1) }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                "hover:scale-125",
                currentIndex === index
                  ? "bg-[#5E6AD2] dark:bg-[#7C89F9] w-6"
                  : "bg-[#E1E4E8] dark:bg-[#2C2D30] hover:bg-[#8B92B5] dark:hover:bg-[#6C6F7E]"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export interface LinearCarouselItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const LinearCarouselItem: React.FC<LinearCarouselItemProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn("w-full", className)} {...props}>
      {children}
    </div>
  );
};
