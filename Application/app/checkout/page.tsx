"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthUser } from "@/hooks/useAuthUser";

interface SimplePlanInfo {
  id: string;
  name: string;
  priceMonthly: number;
}

const SIMPLE_PLANS: SimplePlanInfo[] = [
  { id: "plus", name: "Plus", priceMonthly: 29000 },
  { id: "pro", name: "Pro", priceMonthly: 79000 },
];

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthUser();

  const planParam = searchParams.get("plan");
  const selectedPlan = SIMPLE_PLANS.find((p) => p.id === planParam) ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
            <CardDescription>
              결제 연동은 준비 중입니다. 플랜을 확인하고 다음 단계로 진행하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedPlan ? (
              <div className="text-gray-700">
                선택된 플랜이 없습니다. 먼저 요금제에서 플랜을 골라주세요.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-gray-500">선택한 플랜</div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedPlan.name}
                </div>
                <div className="text-gray-700">
                  월 {selectedPlan.priceMonthly.toLocaleString()}원 (VAT 별도)
                </div>
                {user && (
                  <div className="mt-4 text-sm text-gray-600">
                    결제 계정: <span className="font-medium">{user.email}</span>
                  </div>
                )}
                <div className="mt-6 rounded-md bg-blue-50 text-blue-700 px-4 py-3 text-sm">
                  현재는 결제 PG 연동 전 단계입니다. 결제 문의는 고객센터로
                  남겨주세요.
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="outline" className="sm:w-auto w-full">
              <Link href="/pricing">요금제 돌아가기</Link>
            </Button>
            <Button asChild className="sm:w-auto w-full">
              <Link href="/support">결제 문의하기</Link>
            </Button>
            {!user ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:ml-auto w-full sm:w-auto">
                <Button
                  asChild
                  variant="secondary"
                  className="sm:w-auto w-full"
                >
                  <Link href="/login">로그인</Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  className="sm:w-auto w-full"
                >
                  <Link href="/signup">회원가입</Link>
                </Button>
              </div>
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
