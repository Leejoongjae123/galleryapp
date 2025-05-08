"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  Divider,
  Skeleton,
  Spinner,
  addToast,
} from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { FaPlusCircle } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import useBookmarkStore from "./bookmarkStore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IoCalendarClear } from "react-icons/io5";
import { FaMoneyBillWaveAlt } from "react-icons/fa";

export function ExhibitionCards({ exhibitionCategory, user }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const router = useRouter();
  const PAGE_SIZE = 5;

  const supabase = createClient();

  // Zustand 북마크 스토어에서 상태와 함수 가져오기
  const { bookmarks, setBookmarks } = useBookmarkStore();

  // 북마크 상태 확인하는 함수
  const isBookmarked = (exhibitionId) => {
    return bookmarks.some(
      (bookmark) => bookmark.exhibition_id === exhibitionId
    );
  };

  // 북마크 토글 함수
  const toggleBookmark = async (e, exhibition) => {
    e.preventDefault(); // 링크 이벤트 방지
    e.stopPropagation(); // 이벤트 버블링 방지

    if (!user) {
      // 사용자가 로그인하지 않은 경우 처리
      alert("북마크를 추가하려면 로그인이 필요합니다.");
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

        // Zustand 스토어에서 북마크 제거
        setBookmarks(
          bookmarks.filter(
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

        // Zustand 스토어에 북마크 추가
        setBookmarks([...bookmarks, data[0]]);

        // 북마크 추가 토스트 표시
        addToast({
          title: "북마크 추가",
          description: `${exhibition.name} 북마크에 추가되었습니다.`,
          color: "success",
        });
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
  };

  // 사용자의 북마크 목록 가져오기
  const fetchBookmarks = async () => {
    if (!user) return;

    try {
      setLoadingBookmarks(true);

      const { data, error } = await supabase
        .from("bookmark")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // 북마크 데이터를 Zustand 스토어에 저장
      setBookmarks(data || []);
    } catch (error) {
      console.error("북마크 로드 에러:", error);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  // 컴포넌트 마운트 시 북마크 로드
  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  const getExhibitions = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        setLoading(true);

        // 페이지네이션을 위한 범위 계산
        const from = (pageNum - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // 기본 쿼리 시작
        let query = supabase
          .from("exhibition")
          .select("*", { count: "exact" })
          .gte("end_date", new Date().toISOString())
          .order("review_count", { ascending: false });

        // exhibitionCategory에 따라 필터 적용
        if (exhibitionCategory === "free") {
          query = query.eq("isFree", true);
        } else if (exhibitionCategory === "recommended") {
          query = query.eq("isRecommended", true);
        }
        // 'all'인 경우는 추가 필터 없음

        // 페이지네이션 적용
        const { data, error, count } = await query.range(from, to);

        if (error) {
          console.error("Error fetching exhibitions:", error);
          return;
        }

        // 더 불러올 데이터가 있는지 확인
        setHasMore(count > from + data.length);

        // 데이터 설정 (추가 또는 덮어쓰기)
        if (append) {
          setExhibitions((prev) => [...prev, ...(data || [])]);
        } else {
          setExhibitions(data || []);
        }
      } finally {
        setLoading(false);
      }
    },
    [exhibitionCategory, supabase, PAGE_SIZE]
  );

  // 더 많은 데이터 로드하는 함수
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    getExhibitions(nextPage, true);
  }, [loading, hasMore, page, getExhibitions]);

  useEffect(() => {
    // 카테고리가 변경되면 페이지를 1로 리셋하고 데이터를 다시 불러옵니다
    setPage(1);
    getExhibitions(1);
  }, [getExhibitions]);

  return (
    <>
      <div className="flex flex-col items-center gap-4 w-[90%] justify-center">
        <div className="w-full flex flex-col justify-center items-center gap-y-4">
          {loading && page === 1
            ? // 처음 로딩 중 스켈레톤 UI 표시
              Array(5)
                .fill()
                .map((_, index) => (
                  <div
                    key={index}
                    className="w-full max-w-[600px] flex items-center gap-3 justify-center mx-auto"
                  >
                    <div>
                      <Skeleton className="flex rounded-full w-12 h-12" />
                    </div>
                    <div className="w-full flex flex-col gap-2">
                      <Skeleton className="h-3 w-36 rounded-lg" />
                      <Skeleton className="h-3 w-24 rounded-lg" />
                    </div>
                  </div>
                ))
            : // 데이터 로드 완료 후 실제 전시회 목록 표시
              exhibitions.map((exhibition, index) => (
                <Link key={index} href={`/exhibition/${exhibition.id}`} className="w-full">
                  <Card
                    classNames={{ body: "p-2 justify-center items-center" }}
                    key={index}
                    className="w-full max-w-[600px] "
                    shadow="sm"
                  >
                    <CardBody className="flex gap-4 flex-row w-full h-full justify-center items-center">
                      <div className="flex w-1/2 aspect-square overflow-hidden rounded justify-center items-center">
                        <Image
                          src={exhibition.photo || "/noimage.jpg"}
                          alt={exhibition.name}
                          width={72}
                          height={82}
                          className="object-cover"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iODIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjcyIiBoZWlnaHQ9IjgyIiBmaWxsPSIjZjBmMGYwIiAvPjwvc3ZnPg=="
                        />
                      </div>
                      <div className="flex flex-col w-full justify-center items-center h-full">
                        <div className="flex flex-row justify-between items-start w-full">
                          <div className="flex flex-col">
                            <div className="text-[10px] ">
                              {exhibition.name || "없음"}
                            </div>
                            <div className="text-[12px] font-bold">
                              {exhibition.contents}
                            </div>
                          </div>
                        </div>

                        <Divider
                          orientation="horizontal"
                          className=" bg-gray-300 mt-2"
                        />
                        <div className="text-xs flex flex-col my-2 w-full">
                          <div className="flex flex-row gap-1 items-center">
                            <IoCalendarClear className="text-[#007AFF] w-3 h-3" />
                            <span className="text-[10px]">
                              {exhibition.start_date?.replace(
                                /(\d{4})(\d{2})(\d{2})/,
                                "$1년$2월$3일"
                              )}{" "}
                              ~{" "}
                              {exhibition.end_date?.replace(
                                /(\d{4})(\d{2})(\d{2})/,
                                "$1년$2월$3일"
                              )}
                            </span>
                          </div>
                          <div className="flex flex-row gap-1 items-center">
                            <FaMoneyBillWaveAlt className="text-[#007AFF] w-3 h-3" />
                            
                            <span className="text-[10px]">
                              {exhibition.price
                                ?.toString()
                                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                              원
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 북마크 아이콘을 카드 우측 하단으로 이동 */}
                      <div className="absolute top-2 right-2">
                        <div
                          className="bg-[#eee] rounded-3xl p-1"
                          onClick={(e) => toggleBookmark(e, exhibition)}
                        >
                          {isBookmarked(exhibition.id) ? (
                            <FaBookmark className="text-red-500 text-xs cursor-pointer font-bold" />
                          ) : (
                            <FaRegBookmark className="text-white text-xs cursor-pointer font-bold" />
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}

          {/* 추가 데이터 로딩 중 표시 */}
          {loading && page > 1 && (
            <div className="flex justify-center w-full py-4">
              {/* <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div> */}
              <Spinner variant="wave" size="lg" color="primary" />
            </div>
          )}
        </div>
        {hasMore && !loading ? (
          <FaPlusCircle
            className="text-gray-500 text-2xl font-bold hover:cursor-pointer mb-4"
            onClick={loadMore}
          />
        ) : (
          <div className="text-gray-500 text-sm mb-8">
            모든 전시회를 불러왔습니다
          </div>
        )}
      </div>
    </>
  );
}
