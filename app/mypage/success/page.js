"use client";
import React, { useEffect, useState } from "react";
import { ExhibitionCards } from "./components/exhibition-cards";
import {
  Tabs,
  Tab,
  Button,
  Select,
  SelectItem,
  Divider,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { FaChevronLeft, FaFileContract } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

const Success = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState(null);
  const [customerService, setCustomerService] = useState(null);
  const [title, setTitle] = useState(null);
  const [content, setContent] = useState(null);
  const [selectedModal, setSelectedModal] = useState(null);

  const getPolicy = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("policy").select("*");
    if (error) {
      console.error("정책 정보를 가져오는 중 오류가 발생했습니다:", error);
    }
    
    if (data && data.length > 0) {
      const policyData = data.find(item => item.title === "이용약관");
      const csData = data.find(item => item.title === "고객센터");
      
      setPolicy(policyData);
      setCustomerService(csData);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error(
            "사용자 정보를 가져오는 중 오류가 발생했습니다:",
            error
          );
          router.push("/mypage");
          return;
        }

        if (user) {
          setUser(user);
        } else {
          // 로그인되지 않은 경우 로그인 페이지로 리디렉션
          router.push("/mypage");
        }
      } catch (error) {
        console.error("사용자 정보를 가져오는 중 오류가 발생했습니다:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    if (selectedModal === "policy") {
      setTitle(policy?.title);
      setContent(policy?.content);
    }
    if (selectedModal === "customerService") {
      setTitle(customerService?.title);
      setContent(customerService?.content);
    }
  }, [selectedModal, policy, customerService]);

  useEffect(() => {
    getPolicy();
  }, []);
  console.log('policy', policy);
  console.log('customerService', customerService);

  const handleLogout = async () => {
    try {
      // 카카오 로그아웃 확인
      if (window.Kakao && window.Kakao.Auth.getAccessToken()) {
        // 카카오 초기화 확인
        if (!window.Kakao.isInitialized()) {
          // 카카오 초기화 (KAKAO_APP_KEY는 환경 변수나 설정으로 관리해야 합니다)
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
        }

        // 카카오 로그아웃
        window.Kakao.Auth.logout(() => {
          console.log("카카오 로그아웃 완료");
        });
      }

      // Supabase 로그아웃
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/mypage");
    } catch (error) {
      console.error("로그아웃 중 오류가 발생했습니다:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Spinner variant="wave" color="danger" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-white flex items-center w-[90vw] justify-between">
        <Button
          isIconOnly
          variant="light"
          className="mr-2"
          onPress={() => router.back()}
        >
          <FaChevronLeft className="text-xl" />
        </Button>
        <h2 className="text-lg font-bold text-center flex-grow">마이페이지</h2>
        <div className="w-10"></div>
      </div>
      <div className="w-[90vw] h-auto flex justify-center items-center my-6 flex-col gap-y-4">
        <div className="w-24 h-24 flex justify-center items-center bg-black rounded-full">
          {user?.user_metadata?.avatar_url && (
            <Image
              src={user.user_metadata.avatar_url}
              width={96}
              height={96}
              alt="프로필 이미지"
              className="rounded-full"
            />
          )}
        </div>
        <div className="text-lg font-bold">
          {user?.user_metadata?.full_name || user?.email || "사용자"}
        </div>
      </div>

      <Tabs
        aria-label="Exhibition options"
        variant="underlined"
        className="w-full flex justify-center items-center"
      >
        <Tab
          key="favorite"
          title="나의즐겨찾기"
          className="w-full justify-center items-center"
        >
          <ExhibitionCards />
        </Tab>
        <Tab
          key="review"
          title="리뷰"
          className="w-full justify-center items-center"
        >
          <ExhibitionCards />
        </Tab>
      </Tabs>

      <Tabs
        aria-label="Exhibition options"
        variant="underlined"
        className="w-full flex justify-center items-center"
      >
        <Tab
          key="recommended"
          title="추천갤러리"
          className="w-full justify-center items-center"
        >
          <ExhibitionCards />
        </Tab>
        <Tab
          key="new"
          title="신규갤러리"
          className="w-full justify-center items-center"
        >
          <ExhibitionCards />
        </Tab>
        <Tab
          key="ongoing"
          title="전시중갤러리"
          className="w-full justify-center items-center"
        >
          <ExhibitionCards />
        </Tab>
      </Tabs>

      <div className="w-[90vw] h-auto flex justify-center items-center flex-col gap-y-4 mb-24">
        <div
          onClick={() => {
            setSelectedModal("policy");
            onOpen();
          }}
          className="flex items-center gap-x-2 w-full cursor-pointer"
        >
          <FaFileContract className="text-gray-600" size={20} />
          <span>이용약관 및 정책</span>
        </div>
        <Divider></Divider>
        <div  className="flex items-center gap-x-2 w-full cursor-pointer" onClick={() => {
            setSelectedModal("customerService");
            onOpen();
          }}
        >
          <BiSupport className="text-gray-600" size={20} />
          <span>고객센터</span>
        </div>
        <Divider></Divider>
        <div
          className="flex items-center gap-x-2 w-full cursor-pointer"
          onClick={handleLogout}
        >
          <FiLogOut className="text-gray-600" size={20} />
          <span>로그아웃</span>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {title}
              </ModalHeader>
              <ModalBody>
                <p>
                  {content}
                </p>

              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  확인
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Success;
