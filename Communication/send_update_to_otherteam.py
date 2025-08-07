#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
팀 간 Communication 크로스 프로젝트 동기화 스크립트 v3.0

기능:
1. Frontend receive → 다른팀 프로젝트 send로 동기화
2. 다른팀 프로젝트 receive → Frontend send로 동기화
3. 변경사항 감지 및 알림
4. 동기화 로그 기록

사용법: python send_update_to_otherteam.py
"""

import os
import shutil
import filecmp
from datetime import datetime
from pathlib import Path


class CrossProjectSync:
    """크로스 프로젝트 동기화 클래스"""
    
    def __init__(self):
        self.communication_root = Path(__file__).parent
        self.project_root = self.communication_root.parent.parent  # booster-frontend의 상위 폴더
        self.log_file = self.communication_root / "sync_log.txt"
        self.changes = []
        self.teams = ['Backend', 'Analysis', 'Infra', 'Pipeline', 'Manage']
        
        # 팀별 프로젝트 폴더명 매핑
        self.team_projects = {
            'Backend': 'booster-backend',
            'Analysis': 'booster-analysis', 
            'Infra': 'booster-infra',
            'Pipeline': 'booster-pipeline',
            'Manage': 'booster-manage'
        }
        
        print("🔄 Frontend ↔ 모든 팀 크로스 프로젝트 Communication 동기화 시작")
        print(f"📁 Frontend 경로: {self.communication_root}")
        print(f"📁 프로젝트 루트: {self.project_root}")
        print(f"🤝 대상 팀: {', '.join(self.teams)}")
        print(f"⏰ 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 80)
    
    def sync_all_teams(self):
        """모든 팀과 크로스 동기화"""
        
        for team in self.teams:
            print(f"\n🏢 {team} 팀 크로스 동기화 시작")
            
            team_changes_before = len(self.changes)
            
            # 1. Frontend receive → 다른팀 send 동기화
            self._sync_frontend_to_other_team(team)
            
            # 2. 다른팀 receive → Frontend send 동기화  
            self._sync_other_team_to_frontend(team)
            
            team_changes_after = len(self.changes)
            team_change_count = team_changes_after - team_changes_before
            
            if team_change_count > 0:
                print(f"   ✅ {team} 팀: {team_change_count}개 변경사항 처리")
            else:
                print(f"   ⚪ {team} 팀: 변경사항 없음")
    
    def _sync_frontend_to_other_team(self, team):
        """Frontend receive → 다른팀 send 동기화"""
        
        print(f"   📤 Frontend → {team} 동기화")
        
        # Frontend의 receive 폴더
        frontend_receive_base = self.communication_root / team / 'receive'
        
        # 다른팀 프로젝트의 send 폴더
        other_project_path = self.project_root / self.team_projects[team]
        other_team_send_base = other_project_path / 'Communication' / 'Frontend' / 'send'
        
        if not other_project_path.exists():
            print(f"      ⚠️  {self.team_projects[team]} 프로젝트 폴더가 없습니다")
            return
        
        # Request와 Completed 폴더 동기화
        for folder_type in ['Request', 'Completed']:
            source_path = frontend_receive_base / folder_type
            target_path = other_team_send_base / folder_type
            
            self._sync_folder_pair(source_path, target_path, team, 'outgoing', folder_type)
    
    def _sync_other_team_to_frontend(self, team):
        """다른팀 receive → Frontend send 동기화"""
        
        print(f"   📥 {team} → Frontend 동기화")
        
        # 다른팀 프로젝트의 receive 폴더
        other_project_path = self.project_root / self.team_projects[team]
        other_team_receive_base = other_project_path / 'Communication' / 'Frontend' / 'receive'
        
        # Frontend의 send 폴더
        frontend_send_base = self.communication_root / team / 'send'
        
        if not other_project_path.exists():
            print(f"      ⚠️  {self.team_projects[team]} 프로젝트 폴더가 없습니다")
            return
        
        if not other_team_receive_base.exists():
            print(f"      ⚠️  {team} 프로젝트의 Communication 폴더가 없습니다")
            return
        
        # Request와 Completed 폴더 동기화
        for folder_type in ['Request', 'Completed']:
            source_path = other_team_receive_base / folder_type
            target_path = frontend_send_base / folder_type
            
            self._sync_folder_pair(source_path, target_path, team, 'incoming', folder_type)
    
    def _sync_folder_pair(self, source_path, target_path, team, direction, folder_type):
        """폴더 쌍 동기화"""
        
        direction_icon = "📤" if direction == 'outgoing' else "📥"
        print(f"      {direction_icon} {folder_type}: {source_path.name} → {target_path}")
        
        # 타겟 폴더가 없으면 생성
        target_path.mkdir(parents=True, exist_ok=True)
        
        # 소스 폴더의 모든 .md 파일 확인
        source_files = list(source_path.glob("*.md")) if source_path.exists() else []
        
        if not source_path.exists():
            print(f"         📭 소스 폴더가 없습니다")
        elif not source_files:
            print(f"         📭 폴더가 비어있습니다")
        else:
            for source_file in source_files:
                self._sync_single_file(source_file, target_path, team, direction, folder_type)
        
        # 삭제 동기화: 타겟에는 있지만 소스에는 없는 파일들 삭제 (소스가 없거나 비어있어도 실행)
        self._sync_deletions(source_path, target_path, team, direction, folder_type)
    
    def _sync_single_file(self, source_file, target_path, team, direction, folder_type):
        """개별 파일 동기화"""
        
        target_file = target_path / source_file.name
        
        # 파일이 없는 경우 → 새 파일
        if not target_file.exists():
            shutil.copy2(source_file, target_file)
            direction_text = "발신" if direction == 'outgoing' else "수신"
            change_msg = f"🆕 [{team}] {direction_text} {folder_type} 새 파일: {source_file.name}"
            print(f"         {change_msg}")
            self.changes.append(change_msg)
            
        # 파일이 있는 경우 → 내용 비교
        else:
            if not filecmp.cmp(source_file, target_file, shallow=False):
                shutil.copy2(source_file, target_file)
                
                direction_text = "발신" if direction == 'outgoing' else "수신"
                
                if folder_type == 'Completed':
                    change_msg = f"✅ [{team}] {direction_text} 작업 완료 파일 수정: {source_file.name}"
                else:
                    change_msg = f"📝 [{team}] {direction_text} 요청서 수정: {source_file.name}"
                
                print(f"         {change_msg}")
                self.changes.append(change_msg)
            else:
                print(f"         ⚪ 변경사항 없음: {source_file.name}")
    
    def _sync_deletions(self, source_path, target_path, team, direction, folder_type):
        """삭제 동기화: 타겟에는 있지만 소스에는 없는 파일들 삭제"""
        
        if not target_path.exists():
            return
        
        # 소스 폴더의 파일명 목록
        source_file_names = set()
        if source_path.exists():
            source_file_names = {f.name for f in source_path.glob("*.md")}
        
        # 타겟 폴더의 파일들 확인
        target_files = list(target_path.glob("*.md"))
        
        if not target_files:
            return
        
        # 타겟에는 있지만 소스에는 없는 파일들 찾기
        files_to_delete = []
        for target_file in target_files:
            if target_file.name not in source_file_names:
                files_to_delete.append(target_file)
        
        # 파일 삭제 처리
        for file_to_delete in files_to_delete:
            try:
                file_to_delete.unlink()  # 파일 삭제
                direction_text = "발신" if direction == 'outgoing' else "수신"
                change_msg = f"🗑️ [{team}] {direction_text} {folder_type} 파일 삭제: {file_to_delete.name}"
                print(f"         {change_msg}")
                self.changes.append(change_msg)
            except Exception as e:
                print(f"         ❌ 파일 삭제 실패: {file_to_delete.name} - {str(e)}")
    
    def write_log(self):
        """동기화 로그 기록"""
        
        if not self.changes:
            print(f"\n📝 변경사항이 없어 로그를 기록하지 않습니다.")
            return
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        log_entry = f"""
========================================
크로스 프로젝트 동기화 실행: {timestamp}
========================================
"""
        
        for i, change in enumerate(self.changes, 1):
            log_entry += f"{i}. {change}\n"
        
        log_entry += f"총 {len(self.changes)}개 파일 처리 완료\n"
        
        # 로그 파일에 추가
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(log_entry)
        
        print(f"\n📝 로그 기록 완료: {self.log_file}")
        print(f"📊 총 {len(self.changes)}개 변경사항 처리")
    
    def show_summary(self):
        """동기화 결과 요약"""
        
        print(f"\n" + "=" * 80)
        print("📊 크로스 프로젝트 동기화 결과 요약")
        print("=" * 80)
        
        if self.changes:
            print(f"🔄 처리된 변경사항: {len(self.changes)}개")
            for change in self.changes:
                print(f"   • {change}")
        else:
            print("✅ 모든 파일이 최신 상태입니다.")
        
        print(f"\n⏰ 완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    def run(self):
        """메인 실행"""
        try:
            # 모든 팀과 크로스 동기화
            self.sync_all_teams()
            
            # 로그 기록
            self.write_log()
            
            # 결과 요약
            self.show_summary()
            
        except Exception as e:
            print(f"\n❌ 오류 발생: {str(e)}")
            import traceback
            traceback.print_exc()


def main():
    """메인 함수"""
    try:
        sync = CrossProjectSync()
        sync.run()
    except KeyboardInterrupt:
        print("\n\n⏹️  사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류: {str(e)}")


if __name__ == "__main__":
    main()