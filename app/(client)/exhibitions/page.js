"use client";
import React, { Suspense, useCallback, useMemo } from "react";
import { ExhibitionCards } from "./components/exhibition-cards";
import ExhibitionCarousel from "./components/exhibition-carousel";
import {
  Tabs,
  Tab,
  Button,
  Select,
  SelectItem,
  Spinner,
  Checkbox,
  addToast,
  Skeleton,
  Divider,
  Card,
  CardBody,
} from "@heroui/react";
import { FaChevronLeft, FaPlus } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { FaPlusCircle } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa6";
import Link from "next/link";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FiPlusCircle } from "react-icons/fi";
import Image from "next/image";
// useSearchParams를 사용하는 별도의 클라이언트 컴포넌트
function ExhibitionListContent() {
  const router = useRouter();
  const searchParams = useSearchParams({ suspense: true });
  const initialIsBookmark =
    searchParams.get("isBookmark") === "true" ||
    searchParams.get("isBookmark") === "1";
  const [selectedTab, setSelectedTab] = useState("all");
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [isBookmark, setIsBookmark] = useState(initialIsBookmark);
  const [bookmarks, setBookmarks] = useState([]);
  const [user, setUser] = useState(null);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [popularExhibitionsLoading, setPopularExhibitionsLoading] = useState(true); // 인기 전시회 로딩 상태
  const [highRatingExhibitionsLoading, setHighRatingExhibitionsLoading] = useState(true); // 예술랭픽 로딩 상태
  const [popularExhibitions, setPopularExhibitions] = useState([]);
  const [highRatingExhibitions, setHighRatingExhibitions] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [galleriesLoaded, setGalleriesLoaded] = useState(false); // 갤러리 로드 상태 추적
  
  const supabase = createClient();

  // 사용자 정보 가져오기 - 가장 먼저 실행되어야 함
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  // 사용자의 북마크 목록 가져오기
  const fetchBookmarks = useCallback(async () => {
    if (!user) return;

    try {
      setLoadingBookmarks(true);

      const { data, error } = await supabase
        .from("bookmark")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      setBookmarks(data || []);
    } catch (error) {
      console.error("북마크 로드 에러:", error);
    } finally {
      setLoadingBookmarks(false);
    }
  }, [user, supabase]);

  // 컴포넌트 마운트 시 북마크 로드
  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user, fetchBookmarks]);

  // 최초 한 번 인기 전시회와 평점 높은 전시회를 병렬로 로드 (각각 독립적인 로딩 상태 관리)
  useEffect(() => {
    const fetchPopularExhibitions = async () => {
      try {
        setPopularExhibitionsLoading(true);
        
        const { data, error } = await supabase
          .from("exhibition")
          .select("*,gallery:naver_gallery_url(*)")
          .eq("isRecommended", true)
          .gte("end_date", new Date().toISOString())
          .limit(5);

        if (!error) {
          setPopularExhibitions(data || []);
        }
      } catch (error) {
        console.error("인기 전시회 로드 오류:", error);
      } finally {
        setPopularExhibitionsLoading(false);
      }
    };

    const fetchHighRatingExhibitions = async () => {
      try {
        setHighRatingExhibitionsLoading(true);
        
        const { data, error } = await supabase
          .from("exhibition")
          .select("*,gallery:naver_gallery_url(*)")
          .not("gallery", "is", null)
          .order("review_average", { ascending: false })
          .gte("end_date", new Date().toISOString())
          .limit(9);

        if (!error) {
          setHighRatingExhibitions(data || []);
        }
      } catch (error) {
        console.error("평점 높은 전시회 로드 오류:", error);
      } finally {
        setHighRatingExhibitionsLoading(false);
        setInitialDataLoaded(true);
      }
    };

    // 두 데이터를 병렬로 로드
    fetchPopularExhibitions();
    fetchHighRatingExhibitions();
  }, [supabase]);

  // 북마크 필터 상태가 변경될 때마다 전시회 목록 초기화
  useEffect(() => {
    setPage(1);
    setExhibitions([]);
    setGalleriesLoaded(false);
    setLoading(true);
    setTabLoading(true);
  }, [selectedTab, isBookmark, selectedRegion]);

  // fetchExhibitions 함수를 useCallback으로 메모이제이션
  const fetchExhibitions = useCallback(async () => {
    if (isFetching) return;
    
    try {
      setIsFetching(true);
      
      // 북마크 필터가 활성화되어 있지만 사용자가 로그인하지 않은 경우
      if (isBookmark && !user) {
        setExhibitions([]);
        setHasMore(false);
        setLoading(false);
        setTabLoading(false);
        setGalleriesLoaded(true);
        return;
      }

      // 북마크 필터가 활성화되어 있고 사용자가 로그인했지만 북마크 데이터가 아직 로드 중인 경우
      if (isBookmark && user && loadingBookmarks) {
        return; // 북마크 데이터가 로드될 때까지 대기
      }

      let query = supabase
        .from("exhibition")
        .select("*,gallery:naver_gallery_url(*)")
        .not("gallery", "is", null)
        .order("review_count", { ascending: false })
        .gte("end_date", new Date().toISOString());

      // 선택된 탭에 따라 필터 적용
      if (selectedTab === "free") {
        query = query.eq("isFree", true);
      } else if (selectedTab === "recommended") {
        query = query.eq("isRecommended", true);
      }

      // 지역 필터 적용
      if (selectedRegion) {
        query = query.ilike("gallery.address", `%${selectedRegion}%`);
      }

      // 북마크 필터 적용
      if (isBookmark && user) {
        // null이 아닌 유효한 exhibition_id만 필터링
        const bookmarkedIds = bookmarks
          .filter((b) => b.exhibition_id !== null)
          .map((b) => b.exhibition_id);

        if (bookmarkedIds.length === 0) {
          // 북마크가 없거나 모두 null인 경우 빈 결과 반환
          setExhibitions([]);
          setHasMore(false);
          setLoading(false);
          setTabLoading(false);
          setGalleriesLoaded(true);
          return;
        }

        query = query.in("id", bookmarkedIds);
      }

      // 페이지네이션 적용 - 한 번에 5개씩만 로드
      const { data, error } = await query.range((page - 1) * 5, page * 5 - 1);

      if (error) throw error;

      if (page === 1) {
        setExhibitions(data);
      } else {
        // 중복 방지를 위해 함수형 업데이트로 처리
        setExhibitions((prevExhibitions) => {
          const existingIds = new Set(prevExhibitions.map(ex => ex.id));
          const newData = data.filter(ex => !existingIds.has(ex.id));
          return [...prevExhibitions, ...newData];
        });
      }

      setGalleriesLoaded(true);
      setHasMore(data.length === 5);
    } catch (error) {
      console.error("전시회 데이터를 가져오는 중 오류 발생:", error);
    } finally {
      setLoading(false);
      setTabLoading(false);
      setIsFetching(false);
    }
  }, [page, selectedTab, selectedRegion, isBookmark, bookmarks, user, loadingBookmarks, supabase]);

  // 데이터 페칭을 트리거하는 useEffect - 페이지 변경 시 호출
  useEffect(() => {
    if (page > 1) {
      fetchExhibitions();
    }
  }, [page, fetchExhibitions]);
  
  // 필터 변경 시 데이터 로드
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      if (page === 1) {
        fetchExhibitions();
      }
    }, 100); // 짧은 디바운스 적용
    
    return () => clearTimeout(loadTimer);
  }, [selectedTab, isBookmark, selectedRegion, user, loadingBookmarks, page, fetchExhibitions]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !isFetching) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [loading, hasMore, isFetching]);

  // 북마크 상태 확인하는 함수 - useMemo로 최적화
  const isBookmarked = useCallback(
    (exhibitionId) => {
      return bookmarks.some(
        (bookmark) => bookmark.exhibition_id === exhibitionId
      );
    },
    [bookmarks]
  );

  // 북마크 토글 함수
  const toggleBookmark = useCallback(async (e, exhibition) => {
    e.preventDefault(); // 링크 이벤트 방지
    e.stopPropagation(); // 이벤트 버블링 방지

    if (!user) {
      // 사용자가 로그인하지 않은 경우 처리
      addToast({
        title: "로그인 필요",
        description: "북마크를 추가하려면 로그인이 필요합니다.",
        color: "danger",
      });
      return;
    }

    const isCurrentlyBookmarked = isBookmarked(exhibition.id);

    try {
      if (isCurrentlyBookmarked) {
        // 북마크 삭제
        const { error } = await supabase
          .from("bookmark")
          .delete()
          .eq("user_id", user.id)
          .eq("exhibition_id", exhibition.id);

        if (error) throw error;

        // 북마크 목록에서 제거
        setBookmarks(prevBookmarks => 
          prevBookmarks.filter(
            (bookmark) => bookmark.exhibition_id !== exhibition.id
          )
        );

        // 북마크 삭제 토스트 표시
        addToast({
          title: "북마크 삭제",
          description: `${exhibition.name} 북마크가 삭제되었습니다.`,
          color: "danger",
        });
      } else {
        // 북마크 추가
        const { data, error } = await supabase
          .from("bookmark")
          .insert({
            user_id: user.id,
            exhibition_id: exhibition.id,
            created_at: new Date().toISOString(),
          })
          .select();

        if (error) throw error;

        // 북마크 목록에 추가 - 함수형 업데이트 사용
        setBookmarks(prevBookmarks => [...prevBookmarks, data[0]]);

        // 북마크 추가 토스트 표시
        addToast({
          title: "북마크 추가",
          description: `${exhibition.name} 북마크에 추가되었습니다.`,
          color: "success",
        });
      }
      
      // 북마크 필터가 활성화된 경우 데이터 다시 로드
      if (isBookmark) {
        setPage(1);
        fetchExhibitions();
      }
    } catch (error) {
      console.error("북마크 토글 에러:", error);

      // 에러 토스트 표시
      addToast({
        title: "오류 발생",
        description: "북마크 처리 중 오류가 발생했습니다.",
        color: "danger",
        variant: "solid",
        timeout: 3000,
      });
    }
  }, [user, isBookmarked, isBookmark, supabase, fetchExhibitions]);

  // URL 매개변수 업데이트 함수
  const updateBookmarkUrlParam = useCallback((isBookmarked) => {
    const url = new URL(window.location);
    if (isBookmarked) {
      url.searchParams.set("isBookmark", "true");
    } else {
      url.searchParams.delete("isBookmark");
    }
    window.history.pushState({}, "", url);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* 헤더 - 항상 바로 표시 */}
      <div className="bg-white flex items-center w-[90%] justify-between">
        <Button
          isIconOnly
          variant="light"
          className="mr-2"
          onPress={() => router.push("/")}
        >
          <FaArrowLeft className="text-xl" />
        </Button>
        <h2 className="text-lg font-bold text-center flex-grow">전시회</h2>
        <div className="w-10"></div>
      </div>

      {/* 인기 전시회 섹션 - 독립적인 로딩 상태 */}
      <div className="w-[90%] mt-4 mb-2">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-[18px] font-bold">인기 전시회</h3>
        </div>
        <ExhibitionCarousel
          exhibitions={popularExhibitionsLoading ? [] : popularExhibitions}
          user={user}
          bookmarks={bookmarks}
          toggleBookmark={toggleBookmark}
          isBookmarked={isBookmarked}
        />
      </div>

      {/* 커스텀 탭바 및 필터 영역 - 항상 바로 표시 */}
      <div className="w-[90%] flex flex-col mb-4">
        <div className="flex w-full border-t border-gray-200 mb-2">
          <div className="w-1/6"></div>
          <div className="flex w-2/3">
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "all" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("all")}
            >
              전시회
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "free" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("free")}
            >
              무료전시
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "recommended" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("recommended")}
            >
              추천전시
            </button>
          </div>
          <div className="w-1/6"></div>
        </div>

        {/* 필터 영역 */}
        <div className="flex justify-between items-center w-full bg-white mb-4">
          <Select
            selectedKeys={selectedRegion ? [selectedRegion] : []}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-1/4"
            placeholder="지역"
            size="sm"
          >
            <SelectItem key="서울" value="서울">
              서울
            </SelectItem>
            <SelectItem key="인천" value="인천">
              인천
            </SelectItem>
            <SelectItem key="경기" value="경기">
              경기
            </SelectItem>
            <SelectItem key="대전" value="대전">
              대전
            </SelectItem>
            <SelectItem key="충북" value="충북">
              충북
            </SelectItem>
            <SelectItem key="충남" value="충남">
              충남
            </SelectItem>
            <SelectItem key="대구" value="대구">
              대구
            </SelectItem>
            <SelectItem key="경북" value="경북">
              경북
            </SelectItem>
            <SelectItem key="경남" value="경남">
              경남
            </SelectItem>
            <SelectItem key="부산" value="부산">
              부산
            </SelectItem>
            <SelectItem key="울산" value="울산">
              울산
            </SelectItem>
            <SelectItem key="광주" value="광주">
              광주
            </SelectItem>
            <SelectItem key="전남" value="전남">
              전남
            </SelectItem>
            <SelectItem key="전북" value="전북">
              전북
            </SelectItem>
            <SelectItem key="강원" value="강원">
              강원
            </SelectItem>
            <SelectItem key="제주" value="제주">
              제주
            </SelectItem>
          </Select>

          <Checkbox
            size="sm"
            color="primary"
            value={isBookmark}
            isSelected={isBookmark}
            onChange={(e) => {
              setIsBookmark(e.target.checked);
              updateBookmarkUrlParam(e.target.checked);
            }}
          >
            북마크
          </Checkbox>
        </div>
        
        {/* 전시회 카드 - 로딩 중이면 스켈레톤 표시, 아니면 데이터 표시 */}
        {tabLoading ? (
          <div className="flex flex-col gap-4 w-full">
            {Array(3)
              .fill(null)
              .map((_, index) => (
                <Card key={index} classNames={{body: 'px-2 py-1'}} className="w-full" shadow="none">
                  <CardBody className="grid grid-cols-7 items-center justify-center gap-x-3">
                    <div className="col-span-2">
                      <Skeleton className="rounded h-20 w-20" />
                    </div>
                    <div className="flex flex-col col-span-5 gap-2">
                      <div className="flex flex-row justify-between items-start">
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-3 w-16 rounded-lg" />
                          <Skeleton className="h-3 w-28 rounded-lg" />
                        </div>
                        <Skeleton className="rounded-full h-6 w-6" />
                      </div>
                      
                    </div>
                  </CardBody>
                </Card>
              ))}
          </div>
        ) : galleriesLoaded ? (
          <ExhibitionCards
            exhibitions={exhibitions}
            user={user}
            bookmarks={bookmarks}
            toggleBookmark={toggleBookmark}
            isBookmarked={isBookmarked}
          />
        ) : (
          <div className="flex justify-center items-center w-full my-8">
            
          </div>
        )}

        {!loading && hasMore ? (
          <div className="flex justify-center items-center mt-4">
            <FiPlusCircle
              className="text-gray-500 text-2xl font-bold hover:cursor-pointer"
              onClick={loadMore}
            />
          </div>
        ) : !loading && exhibitions.length > 0 ? (
          <div className="flex justify-center items-center">
            <p className="text-gray-500 my-4">모든 전시회를 불러왔습니다</p>
          </div>
        ) : !loading && exhibitions.length === 0 && galleriesLoaded && (
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-500">전시회가 없습니다</p>
          </div>
        )}
      </div>

      <Divider
        orientation="horizontal"
        className="w-[90%] my-4 bg-[#eee]"
      />

      {/* 예술랭픽 섹션 - 독립적인 로딩 상태 */}
      <div className="w-[90%] flex flex-col justify-center items-center mb-24">
        <div className="w-full flex justify-between items-center">
          <h1 className="text-[18px] font-bold">예술랭픽</h1>
        </div>

        {highRatingExhibitionsLoading ? (
          <div className="w-full grid grid-cols-3 gap-4 mt-6">
            {Array(9)
              .fill(null)
              .map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="h-3 w-3/4 rounded-lg" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-lg" />
                    <Skeleton className="h-3 w-16 rounded-lg" />
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="w-full grid grid-cols-3 gap-4 mt-6">
            {highRatingExhibitions.map((exhibition) => (
              <div key={exhibition.id}>
                <Link href={`/exhibition/${exhibition.id}`}>
                  <Image
                    src={exhibition.photo}
                    alt={exhibition.name}
                    width={100}
                    height={100}
                    className="aspect-square object-cover rounded-lg"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEhgJAi9TUHAAAAABJRU5ErkJggg=="
                  />
                  <div className="text-[14px] font-bold line-clamp-1">
                    {exhibition.contents || "없음"}
                  </div>
                  <div className="text-[13px] text-gray-500 flex items-center justify-start gap-1">
                    <span className="text-yellow-500">
                      <FaStar className="text-[#007AFF]" />
                    </span>
                    <span>
                      {exhibition.review_average || "1.0"} ({exhibition.review_count || 0})
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 메인 컴포넌트는 Suspense로 감싸진 컨텐츠를 렌더링
export default function ExhibitionList() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-screen">
          <Spinner variant="wave" size="lg" color="primary" />
        </div>
      }
    >
      <ExhibitionListContent />
    </Suspense>
  );
}
