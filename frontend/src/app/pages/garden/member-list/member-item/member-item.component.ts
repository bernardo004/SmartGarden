import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-member-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-item.component.html',
  styleUrls: ['./member-item.component.scss']
})
export class MemberItemComponent {
  @Input() member: any;
  @Input() currentUserRole: string = 'Membro';
  @Input() currentUserEmail: string = '';

  @Output() onRoleChange = new EventEmitter<{email: string, action: 'promote' | 'demote'}>();
  @Output() onKick = new EventEmitter<string>();
  @Output() onTransfer = new EventEmitter<any>();
  @Output() onLeave = new EventEmitter<void>();
  @Output() onDeleteGroup = new EventEmitter<void>();
  @Output() onClick = new EventEmitter<void>();

  isMenuOpen = false;

  constructor(private eRef: ElementRef) {}

  get isMe() {
    return this.member.id === this.currentUserEmail;
  }

  get canManage() {
    if (this.isMe) return true;
    if (this.member.role === 'Creatore') return false;
    if (this.currentUserRole === 'Creatore') return true;
    if (this.currentUserRole === 'Admin' && this.member.role === 'Membro') return true;
    return false;
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    const wasOpen = this.isMenuOpen;
    document.dispatchEvent(new Event('click'));

    if (!wasOpen) {
        setTimeout(() => {
            this.isMenuOpen = true;
        }, 0);
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isMenuOpen = false;
    }
  }

  action(type: string, event: Event) {
      event.stopPropagation();
      this.isMenuOpen = false;
      if (type === 'promote') this.onRoleChange.emit({email: this.member.id, action: 'promote'});
      if (type === 'demote') this.onRoleChange.emit({email: this.member.id, action: 'demote'});
      if (type === 'kick') this.onKick.emit(this.member.id);
      if (type === 'transfer') this.onTransfer.emit(this.member);
      if (type === 'leave') this.onLeave.emit();
      if (type === 'delete') this.onDeleteGroup.emit();
  }
}
