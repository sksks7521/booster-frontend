#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Booster Frontend Development Server Runner
==========================================

이 스크립트는 Booster 프론트엔드 개발 서버를 쉽게 실행하기 위한 도구입니다.
Windows/macOS/Linux 모든 플랫폼에서 작동합니다.

사용법:
    python run_server.py

기능:
- 자동 환경변수 설정 (NEXT_PUBLIC_API_BASE_URL)
- Application 디렉터리로 자동 이동
- Next.js 개발 서버 자동 실행
- 포트 충돌 감지 및 해결
- 프로세스 안전 종료
"""

import os
import sys
import subprocess
import platform
import time
import signal
from pathlib import Path

class Colors:
    """터미널 색상 코드"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class FrontendServerRunner:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.app_dir = self.project_root / "Application"
        self.process = None
        
        # 환경 설정
        self.env_vars = {
            "NEXT_PUBLIC_API_BASE_URL": "http://127.0.0.1:8000",
            "NEXT_TELEMETRY_DISABLED": "1",
            "NEXT_SWC_WASM": "1",
            "NEXT_DISABLE_SWC_BINARY": "1"
        }
        
    def print_header(self):
        """헤더 출력"""
        print(f"{Colors.HEADER}{Colors.BOLD}")
        print("=" * 60)
        print("🚀 Booster Frontend Development Server")
        print("=" * 60)
        print(f"{Colors.ENDC}")
        
    def print_info(self, message):
        """정보 메시지 출력"""
        print(f"{Colors.OKBLUE}ℹ️  {message}{Colors.ENDC}")
        
    def print_success(self, message):
        """성공 메시지 출력"""
        print(f"{Colors.OKGREEN}✅ {message}{Colors.ENDC}")
        
    def print_warning(self, message):
        """경고 메시지 출력"""
        print(f"{Colors.WARNING}⚠️  {message}{Colors.ENDC}")
        
    def print_error(self, message):
        """에러 메시지 출력"""
        print(f"{Colors.FAIL}❌ {message}{Colors.ENDC}")
        
    def check_command(self, cmd, name):
        """명령어 존재 확인"""
        is_windows = platform.system().lower() == "windows"
        
        # Windows에서 여러 방식으로 시도
        if is_windows:
            commands_to_try = [
                cmd,  # 원래 명령어
                [cmd[0] + ".cmd"] + cmd[1:],  # .cmd 확장자 추가
                " ".join(cmd)  # shell=True로 실행할 문자열
            ]
        else:
            commands_to_try = [cmd]
            
        for test_cmd in commands_to_try:
            try:
                if isinstance(test_cmd, str):
                    # 문자열이면 shell=True로 실행
                    result = subprocess.run(
                        test_cmd,
                        capture_output=True,
                        text=True,
                        check=True,
                        shell=True
                    )
                else:
                    # 배열이면 일반 실행
                    result = subprocess.run(
                        test_cmd,
                        capture_output=True,
                        text=True,
                        check=True
                    )
                version = result.stdout.strip()
                self.print_success(f"{name} 버전: {version}")
                return True
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue
                
        return False

    def check_node_npm(self):
        """Node.js와 npm 설치 확인"""
        self.print_info("Node.js 환경 확인 중...")
        
        # Node.js 확인
        if not self.check_command(["node", "--version"], "Node.js"):
            self.print_error("Node.js가 설치되지 않았거나 PATH에 없습니다!")
            self.print_info("Node.js를 다운로드하세요: https://nodejs.org/")
            return False
            
        # npm 확인
        if not self.check_command(["npm", "--version"], "npm"):
            self.print_error("npm이 설치되지 않았거나 PATH에 없습니다!")
            return False
            
        return True

    def check_requirements(self):
        """필요 조건 확인"""
        self.print_info("환경 확인 중...")
        
        # Node.js와 npm 확인
        if not self.check_node_npm():
            return False
        
        # Application 디렉터리 존재 확인
        if not self.app_dir.exists():
            self.print_error(f"Application 디렉터리를 찾을 수 없습니다: {self.app_dir}")
            return False
            
        # package.json 확인
        package_json = self.app_dir / "package.json"
        if not package_json.exists():
            self.print_error(f"package.json을 찾을 수 없습니다: {package_json}")
            return False
            
        # node_modules 확인
        node_modules = self.app_dir / "node_modules"
        if not node_modules.exists():
            self.print_warning("node_modules가 없습니다. npm install을 실행합니다...")
            return self.install_dependencies()
            
        self.print_success("환경 확인 완료!")
        return True
        
    def install_dependencies(self):
        """의존성 설치"""
        self.print_info("의존성 설치 중...")
        try:
            # Windows에서는 shell=True로 실행해야 할 수 있음
            if platform.system().lower() == "windows":
                result = subprocess.run(
                    "npm install",
                    cwd=self.app_dir,
                    check=True,
                    capture_output=True,
                    text=True,
                    shell=True
                )
            else:
                result = subprocess.run(
                    ["npm", "install"],
                    cwd=self.app_dir,
                    check=True,
                    capture_output=True,
                    text=True
                )
            self.print_success("의존성 설치 완료!")
            return True
        except subprocess.CalledProcessError as e:
            self.print_error(f"의존성 설치 실패: {e}")
            if e.stdout:
                print(e.stdout)
            if e.stderr:
                print(e.stderr)
            return False
            
    def check_port(self, port=3000):
        """포트 사용 여부 확인"""
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            result = sock.connect_ex(('127.0.0.1', port))
            return result == 0  # 0이면 포트가 사용 중
            
    def kill_process_on_port(self, port=3000):
        """포트를 사용하는 프로세스 종료"""
        system = platform.system().lower()
        
        try:
            if system == "windows":
                # Windows에서 포트를 사용하는 프로세스 찾기
                result = subprocess.run(
                    f'netstat -ano | findstr :{port}',
                    shell=True,
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0 and result.stdout.strip():
                    # PID 추출 후 종료
                    lines = result.stdout.strip().split('\n')
                    for line in lines:
                        if ':3000' in line and 'LISTENING' in line:
                            pid = line.split()[-1]
                            subprocess.run(f'taskkill /PID {pid} /F', shell=True)
                            self.print_info(f"포트 {port}을 사용하던 프로세스(PID: {pid})를 종료했습니다.")
            else:
                # Unix 계열에서 포트를 사용하는 프로세스 종료
                subprocess.run(f'lsof -ti:{port} | xargs kill -9', shell=True)
                self.print_info(f"포트 {port}을 사용하던 프로세스를 종료했습니다.")
        except Exception as e:
            self.print_warning(f"포트 {port} 정리 중 오류 발생: {e}")
            
    def setup_environment(self):
        """환경변수 설정"""
        self.print_info("환경변수 설정 중...")
        
        # 현재 환경에 환경변수 설정
        for key, value in self.env_vars.items():
            os.environ[key] = value
            
        self.print_success("환경변수 설정 완료!")
        self.print_info("설정된 환경변수:")
        for key, value in self.env_vars.items():
            print(f"  • {Colors.OKCYAN}{key}{Colors.ENDC} = {value}")
            
    def try_start_command(self, cmd, env, use_shell=False):
        """명령어 실행 시도"""
        try:
            cmd_str = ' '.join(cmd) if use_shell else cmd
            self.print_info(f"실행 시도: {' '.join(cmd)}" + (" (shell=True)" if use_shell else ""))
            
            if use_shell:
                process = subprocess.Popen(
                    cmd_str,
                    cwd=self.app_dir,
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    universal_newlines=True,
                    bufsize=1,
                    shell=True,
                    encoding='utf-8',
                    errors='ignore'  # 인코딩 에러 무시
                )
            else:
                process = subprocess.Popen(
                    cmd,
                    cwd=self.app_dir,
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    universal_newlines=True,
                    bufsize=1,
                    encoding='utf-8',
                    errors='ignore'  # 인코딩 에러 무시
                )
            return process
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            self.print_warning(f"명령어 실행 실패: {e}")
            return None

    def start_server(self):
        """개발 서버 시작"""
        self.print_info("Next.js 개발 서버 시작 중...")
        
        try:
            # 포트 충돌 확인 및 해결
            if self.check_port(3000):
                self.print_warning("포트 3000이 이미 사용 중입니다. 기존 프로세스를 종료합니다...")
                self.kill_process_on_port(3000)
                time.sleep(2)
                
            # 환경변수를 포함한 새로운 환경 생성
            env = os.environ.copy()
            env.update(self.env_vars)
            
            self.print_info(f"작업 디렉터리: {self.app_dir}")
            
            # Windows와 Unix 계열에 따른 명령어 시도
            is_windows = platform.system().lower() == "windows"
            
            if is_windows:
                # Windows에서 시도할 명령어들
                commands_to_try = [
                    (["npm", "run", "dev:8000"], False),  # 배열로 먼저 시도
                    (["npm", "run", "dev:8000"], True),   # shell=True로 시도
                    (["npm", "run", "dev"], False),
                    (["npm", "run", "dev"], True),
                    (["npm.cmd", "run", "dev:8000"], False),  # .cmd 확장자 명시
                    (["npx.cmd", "next", "dev"], False),
                    (["npx", "next", "dev"], True),
                    (["node", "node_modules/.bin/next", "dev"], False)
                ]
            else:
                # Unix 계열에서 시도할 명령어들
                commands_to_try = [
                    (["npm", "run", "dev:8000"], False),
                    (["npm", "run", "dev"], False),
                    (["npx", "next", "dev"], False),
                    (["node", "node_modules/.bin/next", "dev"], False)
                ]
            
            self.process = None
            for cmd, use_shell in commands_to_try:
                self.process = self.try_start_command(cmd, env, use_shell)
                if self.process:
                    self.print_success(f"명령어 성공: {' '.join(cmd)}")
                    break
                    
            if not self.process:
                self.print_error("모든 실행 방법이 실패했습니다.")
                self.print_info("다음 사항을 확인해주세요:")
                self.print_info("1. Node.js와 npm이 올바르게 설치되어 있는지")
                self.print_info("2. PATH 환경변수에 Node.js가 포함되어 있는지") 
                self.print_info("3. PowerShell 실행 정책이 올바르게 설정되어 있는지")
                raise Exception("서버 시작에 실패했습니다.")
            
            self.print_success("개발 서버가 시작되었습니다!")
            self.print_info("서버 로그:")
            print("-" * 60)
            
            # 실시간 로그 출력
            while True:
                output = self.process.stdout.readline()
                if output == '' and self.process.poll() is not None:
                    break
                if output:
                    print(output.strip())
                    
                    # Ready 메시지가 나오면 브라우저 안내
                    if "Ready" in output and "localhost:3000" in output:
                        print(f"\n{Colors.OKGREEN}{Colors.BOLD}🎉 서버 준비 완료!{Colors.ENDC}")
                        print(f"{Colors.OKCYAN}📌 브라우저에서 다음 주소로 접속하세요:{Colors.ENDC}")
                        print(f"   {Colors.UNDERLINE}http://localhost:3000{Colors.ENDC}")
                        print(f"   {Colors.UNDERLINE}http://localhost:3000/analysis{Colors.ENDC}")
                        print(f"\n{Colors.WARNING}⚠️  종료하려면 Ctrl+C를 눌러주세요.{Colors.ENDC}\n")
                        
        except KeyboardInterrupt:
            self.print_info("사용자가 서버를 중단했습니다.")
        except Exception as e:
            self.print_error(f"서버 실행 중 오류 발생: {e}")
        finally:
            self.cleanup()
            
    def cleanup(self):
        """정리 작업"""
        if self.process:
            self.print_info("서버를 종료하는 중...")
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.print_warning("강제로 서버를 종료합니다...")
                self.process.kill()
                self.process.wait()
            except Exception as e:
                self.print_error(f"서버 종료 중 오류: {e}")
                
        self.print_success("서버가 종료되었습니다.")
        
    def run(self):
        """메인 실행 함수"""
        try:
            self.print_header()
            
            # 시스템 정보 출력
            self.print_info(f"운영체제: {platform.system()} {platform.release()}")
            self.print_info(f"Python 버전: {sys.version.split()[0]}")
            self.print_info(f"프로젝트 경로: {self.project_root}")
            print()
            
            # 필요 조건 확인
            if not self.check_requirements():
                sys.exit(1)
                
            # 환경변수 설정
            self.setup_environment()
            print()
            
            # 서버 시작
            self.start_server()
            
        except KeyboardInterrupt:
            self.print_info("\n사용자가 중단했습니다.")
        except Exception as e:
            self.print_error(f"예상치 못한 오류: {e}")
            sys.exit(1)
        finally:
            print(f"\n{Colors.HEADER}감사합니다! 🙏{Colors.ENDC}")

def signal_handler(signum, frame):
    """시그널 핸들러"""
    print(f"\n{Colors.WARNING}종료 신호를 받았습니다...{Colors.ENDC}")
    sys.exit(0)

if __name__ == "__main__":
    # 시그널 핸들러 등록
    signal.signal(signal.SIGINT, signal_handler)
    if platform.system() != "Windows":
        signal.signal(signal.SIGTERM, signal_handler)
    
    # 서버 실행
    runner = FrontendServerRunner()
    runner.run()
