"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { authApi, type UserCreate } from "@/lib/api";

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
    birthdate: "",
    gender: "" as "male" | "female" | "",
    agreed_to_terms: false,
    agreed_to_privacy_policy: false,
    agreed_to_marketing: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: "bg-gray-200",
  });

  // 비밀번호 강도 체크
  const checkPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("8자 이상 입력하세요");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("대문자를 포함하세요");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("소문자를 포함하세요");
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("숫자를 포함하세요");
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("특수문자를 포함하세요");
    }

    let color = "bg-red-500";
    if (score >= 4) color = "bg-green-500";
    else if (score >= 3) color = "bg-yellow-500";
    else if (score >= 2) color = "bg-orange-500";

    return { score, feedback, color };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 비밀번호 강도 체크
    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }

    // 실시간 유효성 검사
    const newErrors = { ...errors };
    delete newErrors[name];

    if (name === "email" && value && !value.includes("@")) {
      newErrors.email = "올바른 이메일 형식을 입력해주세요";
    }

    if (name === "confirmPassword" && value && value !== formData.password) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
    }

    if (
      name === "password" &&
      formData.confirmPassword &&
      value !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
    }

    setErrors(newErrors);
  };

  const handleBirthdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      birthdate: value,
    }));

    // 실시간 유효성 검사
    const newErrors = { ...errors };
    delete newErrors.birthdate;

    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      newErrors.birthdate = "올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD)";
    }

    setErrors(newErrors);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, ""); // 숫자만 허용

    // 자동 하이픈 추가
    if (value.length >= 3 && value.length <= 6) {
      value = value.replace(/(\d{3})(\d+)/, "$1-$2");
    } else if (value.length >= 7) {
      value = value.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3");
    }

    if (value.length <= 13) {
      // 010-0000-0000 형태
      setFormData((prev) => ({
        ...prev,
        phone_number: value,
      }));

      // 실시간 유효성 검사
      const newErrors = { ...errors };
      delete newErrors.phone_number;

      const phoneRegex = /^010-\d{4}-\d{4}$/;
      if (value && !phoneRegex.test(value)) {
        newErrors.phone_number =
          "올바른 전화번호 형식을 입력해주세요 (010-0000-0000)";
      }

      setErrors(newErrors);
    }
  };

  const handleGenderChange = (value: "male" | "female") => {
    setFormData((prev) => ({
      ...prev,
      gender: value,
    }));

    // 에러 제거
    const newErrors = { ...errors };
    delete newErrors.gender;
    setErrors(newErrors);
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));

    // 필수 약관 체크
    const newErrors = { ...errors };
    if (name === "agreed_to_terms" && !checked) {
      newErrors.agreed_to_terms = "이용약관에 동의해주세요";
    } else {
      delete newErrors.agreed_to_terms;
    }

    if (name === "agreed_to_privacy_policy" && !checked) {
      newErrors.agreed_to_privacy_policy = "개인정보처리방침에 동의해주세요";
    } else {
      delete newErrors.agreed_to_privacy_policy;
    }

    setErrors(newErrors);
  };

  const handleAllAgree = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreed_to_terms: checked,
      agreed_to_privacy_policy: checked,
      agreed_to_marketing: checked,
    }));

    if (checked) {
      const newErrors = { ...errors };
      delete newErrors.agreed_to_terms;
      delete newErrors.agreed_to_privacy_policy;
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "이름을 입력해주세요";
    }

    if (!formData.birthdate.trim()) {
      newErrors.birthdate = "생년월일을 입력해주세요";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.birthdate)) {
      newErrors.birthdate = "올바른 날짜 형식을 입력해주세요 (YYYY-MM-DD)";
    }

    if (!formData.gender) {
      newErrors.gender = "성별을 선택해주세요";
    }

    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요";
    } else if (!formData.email.includes("@")) {
      newErrors.email = "올바른 이메일 형식을 입력해주세요";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "전화번호를 입력해주세요";
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.phone_number)) {
      newErrors.phone_number =
        "올바른 전화번호 형식을 입력해주세요 (010-0000-0000)";
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요";
    } else if (passwordStrength.score < 3) {
      newErrors.password = "더 강한 비밀번호를 사용해주세요";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호 확인을 입력해주세요";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
    }

    if (!formData.agreed_to_terms) {
      newErrors.agreed_to_terms = "이용약관에 동의해주세요";
    }

    if (!formData.agreed_to_privacy_policy) {
      newErrors.agreed_to_privacy_policy = "개인정보처리방침에 동의해주세요";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      // UserCreate 스키마에 맞게 데이터 준비
      const userData: UserCreate = {
        email: formData.email,
        full_name: formData.full_name,
        birthdate: formData.birthdate,
        gender: (formData.gender || "male") as "male" | "female",
        phone_number: formData.phone_number,
        agreed_to_terms: formData.agreed_to_terms,
        agreed_to_privacy_policy: formData.agreed_to_privacy_policy,
        agreed_to_marketing: formData.agreed_to_marketing,
      };

      // 실제 API 호출
      const user = await authApi.signup(userData);

      // 성공 시 사용자 정보 저장 (실제 구현에서는 토큰 관리 필요)
      localStorage.setItem("booster_user", JSON.stringify(user));

      // 분석 페이지로 리다이렉트
      router.push("/analysis?welcome=true");
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const allRequiredAgreed =
    formData.agreed_to_terms && formData.agreed_to_privacy_policy;
  const allAgreed = allRequiredAgreed && formData.agreed_to_marketing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 버튼 */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-gray-600 hover:text-gray-900"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>

        {/* 회원가입 카드 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center mb-6">
              <div className="text-2xl font-bold text-blue-600">부스터</div>
              <div className="ml-2 text-sm text-gray-500">Booster</div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-gray-600">부동산 분석을 시작하세요</p>
          </div>

          {/* 전체 에러 메시지 */}
          {errors.general && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errors.general}
              </AlertDescription>
            </Alert>
          )}

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이름 입력 */}
            <div className="space-y-2">
              <Label
                htmlFor="full_name"
                className="text-sm font-medium text-gray-700"
              >
                이름 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="이름을 입력하세요"
                  className={`pl-10 h-12 ${
                    errors.full_name
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.full_name && (
                <p className="text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.full_name}
                </p>
              )}
            </div>

            {/* 생년월일 입력 */}
            <div className="space-y-2">
              <Label
                htmlFor="birthdate"
                className="text-sm font-medium text-gray-700"
              >
                생년월일 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={handleBirthdateChange}
                  className={`${
                    errors.birthdate
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.birthdate && (
                <p className="text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.birthdate}
                </p>
              )}
            </div>

            {/* 성별 선택 */}
            <div className="space-y-2">
              <Label
                htmlFor="gender"
                className="text-sm font-medium text-gray-700"
              >
                성별 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={handleGenderChange}
                disabled={isLoading}
              >
                <SelectTrigger
                  className={`${
                    errors.gender
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                >
                  <SelectValue placeholder="성별을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.gender}
                </p>
              )}
            </div>

            {/* 이메일 입력 */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                이메일 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="이메일을 입력하세요"
                  className={`pl-10 h-12 ${
                    errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* 전화번호 입력 */}
            <div className="space-y-2">
              <Label
                htmlFor="phone_number"
                className="text-sm font-medium text-gray-700"
              >
                전화번호 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  className={`${
                    errors.phone_number
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.phone_number && (
                <p className="text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.phone_number}
                </p>
              )}
            </div>

            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                비밀번호 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 입력하세요"
                  className={`pl-10 pr-10 h-12 ${
                    errors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* 비밀번호 강도 표시 */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {passwordStrength.score < 2
                        ? "약함"
                        : passwordStrength.score < 4
                        ? "보통"
                        : "강함"}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {passwordStrength.feedback.join(", ")}
                    </div>
                  )}
                </div>
              )}

              {errors.password && (
                <p className="text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700"
              >
                비밀번호 확인 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 다시 입력하세요"
                  className={`pl-10 pr-10 h-12 ${
                    errors.confirmPassword
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    비밀번호가 일치합니다
                  </p>
                )}
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* 약관 동의 */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="space-y-3">
                {/* 전체 동의 */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="agreeAll"
                    checked={allAgreed}
                    onCheckedChange={handleAllAgree}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="agreeAll"
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    전체 동의
                  </Label>
                </div>

                {/* 개별 약관 */}
                <div className="space-y-2 pl-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agreed_to_terms"
                        checked={formData.agreed_to_terms}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(
                            "agreed_to_terms",
                            checked as boolean
                          )
                        }
                        disabled={isLoading}
                      />
                      <Label
                        htmlFor="agreed_to_terms"
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        이용약관 동의 <span className="text-red-500">*</span>
                      </Label>
                    </div>
                    <Link
                      href="/terms"
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      보기
                    </Link>
                  </div>
                  {errors.agreed_to_terms && (
                    <p className="text-xs text-red-600 ml-6">
                      {errors.agreed_to_terms}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agreed_to_privacy_policy"
                        checked={formData.agreed_to_privacy_policy}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(
                            "agreed_to_privacy_policy",
                            checked as boolean
                          )
                        }
                        disabled={isLoading}
                      />
                      <Label
                        htmlFor="agreed_to_privacy_policy"
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        개인정보처리방침 동의{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                    </div>
                    <Link
                      href="/privacy"
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      보기
                    </Link>
                  </div>
                  {errors.agreed_to_privacy_policy && (
                    <p className="text-xs text-red-600 ml-6">
                      {errors.agreed_to_privacy_policy}
                    </p>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreed_to_marketing"
                      checked={formData.agreed_to_marketing}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "agreed_to_marketing",
                          checked as boolean
                        )
                      }
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="agreed_to_marketing"
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      마케팅 정보 수신 동의 (선택)
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* 회원가입 버튼 */}
            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
              disabled={isLoading || !allRequiredAgreed}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>회원가입 중...</span>
                </div>
              ) : (
                "회원가입"
              )}
            </Button>
          </form>

          {/* 구분선 */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="px-4 text-sm text-gray-500">또는</div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* 로그인 링크 */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">이미 계정이 있으신가요?</p>
            <Button
              variant="outline"
              className="w-full h-12 border-gray-300 text-gray-700 bg-transparent"
              asChild
            >
              <Link href="/login">로그인</Link>
            </Button>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-700 mr-4">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:text-gray-700 mr-4">
            개인정보처리방침
          </Link>
          <Link href="/support" className="hover:text-gray-700">
            고객센터
          </Link>
        </div>
      </div>
    </div>
  );
}
