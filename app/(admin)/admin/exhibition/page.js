"use client";
import React, { useState, useEffect } from "react";
import { HiUsers, HiPhotograph, HiClock, HiThumbUp } from "react-icons/hi";
import { ExhibitionList } from "../components/exhibition-list";
import { ExhibitionDetail } from "../components/exhibition-detail";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";

// 통계 카드 컴포넌트
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center">
    <div className={`rounded-full p-3 ${color}`}>{icon}</div>
    <div className="ml-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export default function Exhibition() {
  // Supabase 클라이언트 생성
  const supabase = createClient();

  // 상태 관리
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [refreshToggle, setRefreshToggle] = useState(0);
  const [refreshFunction, setRefreshFunction] = useState(null);

  // 전시회 선택 시 호출되는 함수
  const handleSelectExhibition = (exhibition) => {
    setSelectedExhibition(exhibition);
  };

  // 전시회 업데이트 시 호출되는 함수
  const handleUpdateExhibition = (updatedExhibition) => {
    setSelectedExhibition(updatedExhibition);
  };

  // 신규 전시회 등록 시 호출되는 함수
  const handleCreateExhibition = () => {
    // 새 전시회 객체 생성 (빈 값으로 초기화)
    const newExhibition = {
      name: "",
      contents: "",
      photo: "",
      date: "",
      working_hour: "",
      off_date: "",
      add_info: "",
      homepage_url: "",
      isFree: false,
      isRecommended: false,
      review_count: 0,
      review_average: 0,
      naver_gallery_url: "",
      price: 0,
    };

    setSelectedExhibition(newExhibition);
    setSelectedKeys(new Set([]));
  };

  // 새로고침 함수 설정
  const handleSetRefreshFunction = (refreshFunc) => {
    setRefreshFunction(refreshFunc);
  };

  return (
    <div className="w-full h-full p-4 space-y-8 py-20">
      <div className="flex max-w-7xl mx-auto flex-col gap-6">
        {/* 왼쪽 영역 - 전시회 목록 */}
        <div className="w-full space-y-4">
          <h1 className="text-2xl font-bold">전시회 관리</h1>
          <ExhibitionList
            onSelectExhibition={handleSelectExhibition}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            onCreateExhibition={handleCreateExhibition}
            onRefresh={handleSetRefreshFunction}
            refreshToggle={refreshToggle}
            setRefreshToggle={setRefreshToggle}
          />
        </div>

        {/* 오른쪽 영역 - 전시회 상세 정보 */}
        <div className="w-full ">
          <section className="bg-content2 rounded-lg p-4">
            {selectedExhibition ? (
              <ExhibitionDetail
                exhibition={selectedExhibition}
                onUpdate={handleUpdateExhibition}
                selectedKeys={selectedKeys}
                setSelectedKeys={setSelectedKeys}
                onRefresh={() => {
                  // 전시회 목록 새로고침 함수 호출
                  if (refreshFunction) {
                    console.log('부모 컴포넌트: 전시회 목록 새로고침 시도');
                    refreshFunction();
                    console.log('부모 컴포넌트: 전시회 목록 새로고침 완료');
                  } else {
                    console.log('부모 컴포넌트: refreshFunction 함수가 없습니다');
                  }
                }}
                refreshToggle={refreshToggle}
                setRefreshToggle={setRefreshToggle}
                selectedExhibition={selectedExhibition}
                setSelectedExhibition={setSelectedExhibition}
              />
            ) : (
              <div className="text-center text-default-500 py-8">
                전시회를 선택하면 상세 정보가 표시됩니다.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
