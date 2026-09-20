import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberItemComponent } from './member-item/member-item.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule, MemberItemComponent, RouterLink],
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss']
})
export class MemberListComponent {
  @Input() admins: any[] = [];
  @Input() participants: any[] = [];
  @Input() currentUserRole: string = 'Membro';
  @Input() currentUserEmail: string = '';
  @Input() isLoading: boolean = true;

  @Output() onInvite = new EventEmitter<void>();
  @Output() onRoleChange = new EventEmitter<{email: string, action: 'promote' | 'demote'}>();
  @Output() onKick = new EventEmitter<string>();
  @Output() onMemberClick = new EventEmitter<any>();

  @Output() onTransfer = new EventEmitter<any>();
  @Output() onLeave = new EventEmitter<void>();
  @Output() onDeleteGroup = new EventEmitter<void>();
}
