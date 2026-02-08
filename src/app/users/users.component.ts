import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { UsersService } from './users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  users: any[] = [];
  displayedColumns = ['sl', 'username', 'password', 'actions'];
  maxUsers = 4;

  // inline add/edit state
  isAdding = false;
  editingUserId: number | null = null;

  newUser = { username: '', password: '' };
  editModel = { username: '', password: '', showPassword: false };
  showNewPassword = false;

  constructor(private usersService: UsersService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getUsers().subscribe(res => {
      this.users = res;
      this.isAdding = false;
      this.editingUserId = null;
    });
  }

  canAddUser() {
    return this.users.length < this.maxUsers;
  }

  /* ================= ADD ================= */

  startAdd() {
    this.isAdding = true;
    this.newUser = { username: '', password: '' };
  }

  cancelAdd() {
    this.isAdding = false;
  }

  saveNewUser() {
    if (!this.newUser.username || !this.newUser.password) return;

    this.usersService.addUser(this.newUser).subscribe(() => {
      this.loadUsers();
    });
  }

  /* ================= EDIT ================= */

  startEdit(user: any) {
    this.editingUserId = user.id;
    this.editModel = {
      username: user.username,
      password: '',
      showPassword: false
    };
  }

  cancelEdit() {
    this.editingUserId = null;
  }

  saveEdit(user: any) {
    const payload: any = {
      username: this.editModel.username
    };

    if (this.editModel.password) {
      payload.password = this.editModel.password;
    }

    this.usersService.updateUser(user.id, payload).subscribe(() => {
      this.loadUsers();
    });
  }
}
