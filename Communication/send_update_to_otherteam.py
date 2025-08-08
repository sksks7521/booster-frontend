#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
팀 간 Communication 크로스 프로젝트 반영 스크립트 v3.0

기능:
1. 내 send → 상대 receive로 덮어쓰기(타겟을 내 상태로 맞춤)
2. 내 receive → 상대 send로 덮어쓰기(타겟을 내 상태로 맞춤)
3. 변경사항 감지 및 알림(생성/수정/삭제/완료 이동)
4. 반영 결과 로그 기록

사용법: python send_update_to_otherteam.py
"""

import os
import shutil
import filecmp
from datetime import datetime
from pathlib import Path


class CrossProjectSync:
    """크로스 프로젝트 반영 클래스"""
    
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
        
        print("🚀 Frontend 기준으로 모든 팀 Communication 반영 시작")
        print(f"📁 Frontend 경로: {self.communication_root}")
        print(f"📁 프로젝트 루트: {self.project_root}")
        print(f"🤝 대상 팀: {', '.join(self.teams)}")
        print(f"⏰ 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 80)
    
    def sync_all_teams(self):
        """모든 팀에 현재 프로젝트 상태 반영"""
        
        for team in self.teams:
            print(f"\n🏢 {team} 팀 처리 시작 (내 폴더 → 상대 폴더 덮어쓰기)")
            
            team_changes_before = len(self.changes)
            
            # 1) 내 send → 상대 receive
            self._sync_frontend_to_other_team(team)
            # 2) 내 receive → 상대 send
            self._push_my_receive_to_other_send(team)
            
            team_changes_after = len(self.changes)
            team_change_count = team_changes_after - team_changes_before
            
            if team_change_count > 0:
                print(f"   ✅ {team} 팀: {team_change_count}개 변경사항 적용")
            else:
                print(f"   ⚪ {team} 팀: 변경사항 없음")
    
    def _sync_frontend_to_other_team(self, team):
        """내 send → 상대 receive 반영 (타겟을 내 상태로 덮어쓰기)"""
        
        print(f"   📤 내 send → {team} receive 반영")
        
        # Frontend의 send 폴더(내가 보낸 것)
        frontend_send_base = self.communication_root / team / 'send'
        
        # 다른팀 프로젝트의 receive 폴더(상대가 받는 곳)
        other_project_path = self.project_root / self.team_projects[team]
        other_team_receive_base = other_project_path / 'Communication' / 'Frontend' / 'receive'
        
        if not other_project_path.exists():
            print(f"      ⚠️  {self.team_projects[team]} 프로젝트 폴더가 없습니다")
            return
        
        # Request와 Completed 폴더 반영 (상대 폴더는 필요 시 삭제 허용)
        for folder_type in ['Request', 'Completed']:
            source_path = frontend_send_base / folder_type
            target_path = other_team_receive_base / folder_type
            
            self._sync_folder_pair(
                source_path,
                target_path,
                team,
                'outgoing',
                folder_type,
                allow_delete_target=True,
                source_base=frontend_send_base,
                target_base=other_team_receive_base,
            )
    
    def _push_my_receive_to_other_send(self, team):
        """내 receive → 상대 send 반영 (타겟을 내 상태로 덮어쓰기)"""
        
        print(f"   📤 내 receive → {team} send 반영")
        
        # Frontend의 receive 폴더(내가 받은 것, 내 상태가 기준)
        frontend_receive_base = self.communication_root / team / 'receive'
        
        # 다른팀 프로젝트의 send 폴더(상대가 보낼 폴더를 내 상태로 세팅)
        other_project_path = self.project_root / self.team_projects[team]
        other_team_send_base = other_project_path / 'Communication' / 'Frontend' / 'send'
        
        if not other_project_path.exists():
            print(f"      ⚠️  {self.team_projects[team]} 프로젝트 폴더가 없습니다")
            return
        
        # Request와 Completed 폴더 반영 (상대 폴더는 필요 시 삭제 허용)
        for folder_type in ['Request', 'Completed']:
            source_path = frontend_receive_base / folder_type
            target_path = other_team_send_base / folder_type
            
            self._sync_folder_pair(
                source_path,
                target_path,
                team,
                'outgoing',
                folder_type,
                allow_delete_target=True,
                source_base=frontend_receive_base,
                target_base=other_team_send_base,
            )
    
    def _sync_folder_pair(self, source_path, target_path, team, direction, folder_type, allow_delete_target, source_base, target_base):
        """폴더 반영(덮어쓰기)
        - allow_delete_target: 타겟 폴더에서 소스에 없는 파일 삭제 허용 여부
        - source_base/target_base: Request/Completed 상호 참조를 위한 베이스 경로
        """
        
        direction_icon = "📤" if direction == 'outgoing' else "📥"
        print(f"      {direction_icon} {folder_type}: {source_path.name} → {target_path} (덮어쓰기)")
        
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
        
        # 삭제 처리: 정책에 따라 수행 (소스가 없거나 비어있어도 실행)
        if allow_delete_target:
            self._sync_deletions_with_completion_awareness(
                source_base=source_base,
                target_base=target_base,
                team=team,
                direction=direction,
                current_folder_type=folder_type,
            )
    
    def _sync_single_file(self, source_file, target_path, team, direction, folder_type):
        """개별 파일 반영"""
        
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
    
    def _sync_deletions_with_completion_awareness(self, source_base, target_base, team, direction, current_folder_type):
        """삭제 처리(타겟 기준) + 완료 이동(Request→Completed) 인지하여 메시지 개선
        - source_base/target_base는 각각 Request/Completed 하위 폴더를 포함하는 베이스 경로
        - current_folder_type는 'Request' 또는 'Completed'
        """
        # 경로 설정
        source_request = source_base / 'Request'
        source_completed = source_base / 'Completed'
        target_request = target_base / 'Request'
        target_completed = target_base / 'Completed'

        # 소스 파일 세트 준비
        source_request_names = set(f.name for f in source_request.glob('*.md')) if source_request.exists() else set()
        source_completed_names = set(f.name for f in source_completed.glob('*.md')) if source_completed.exists() else set()

        direction_text = "발신" if direction == 'outgoing' else "수신"

        # 현재 처리 중인 폴더의 타겟 파일 목록
        target_dir = target_request if current_folder_type == 'Request' else target_completed
        if not target_dir.exists():
            return

        target_files = list(target_dir.glob('*.md'))
        if not target_files:
            return

        for target_file in target_files:
            name = target_file.name
            if current_folder_type == 'Request':
                # 소스 Request에 없으면 삭제. 단, 소스 Completed에 있으면 완료로 간주
                if name not in source_request_names:
                    try:
                        target_file.unlink()
                        if name in source_completed_names:
                            change_msg = f"✅ [{team}] {direction_text} 요청 완료: {name} (Request → Completed)"
                        else:
                            change_msg = f"🗑️ [{team}] {direction_text} Request 파일 삭제: {name}"
                        print(f"         {change_msg}")
                        self.changes.append(change_msg)
                    except Exception as e:
                        print(f"         ❌ 파일 삭제 실패: {name} - {str(e)}")
            else:  # current_folder_type == 'Completed'
                # 소스 Completed에 없으면 삭제
                if name not in source_completed_names:
                    try:
                        target_file.unlink()
                        change_msg = f"🗑️ [{team}] {direction_text} Completed 파일 삭제: {name}"
                        print(f"         {change_msg}")
                        self.changes.append(change_msg)
                    except Exception as e:
                        print(f"         ❌ 파일 삭제 실패: {name} - {str(e)}")
    
    def write_log(self):
        """로그 기록"""
        
        if not self.changes:
            print(f"\n📝 변경사항이 없어 로그를 기록하지 않습니다.")
            return
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        log_entry = f"""
 ========================================
 크로스 프로젝트 반영 실행: {timestamp}
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
        """적용 결과 요약"""
        
        print(f"\n" + "=" * 80)
        print("📊 크로스 프로젝트 적용 결과 요약")
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
            # 모든 팀에 반영 실행
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