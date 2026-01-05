import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  selectedFile: File | null = null;
  result: any = null;
  isLoggedIn: boolean = false;
  loginData = { username: '', password: '' };
  
  isLoggingIn: boolean = false;
  isUploading: boolean = false;
  isCheckingAuth: boolean = false;
  
  currentUser: { username: string } | null = null;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    console.log('ngOnInit çalıştı');
    // Cookie otomatik gönderilir
    this.checkAuth();
  }

  // Token geçerliliğini kontrol et (Cookie otomatik gider)
  checkAuth() {
    if (this.isCheckingAuth) return;
    this.isCheckingAuth = true;
    
    // withCredentials: true (Cookie gönderimi için ZORUNLU!)
    this.http.get<{ success: boolean; user: { username: string } }>(
      'http://localhost:3000/api/auth/me',
      { withCredentials: true }  // Cookie gönder
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.currentUser = res.user;
          this.isLoggedIn = true;
          console.log('Otomatik giriş başarılı:', res.user.username);
        }
        this.isCheckingAuth = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('Token yok veya geçersiz');
        this.isCheckingAuth = false;
        this.isLoggedIn = false;
        this.cdr.detectChanges();
      }
    });
  }

  onLogin() {
    if (this.isLoggingIn) return;

    if (!this.loginData.username || !this.loginData.password) {
      alert('Kullanıcı adı ve şifre gerekli!');
      return;
    }

    console.log('Login isteği gönderiliyor...');
    this.isLoggingIn = true;

    // withCredentials: true (Cookie alımı için ZORUNLU!)
    this.http.post<{ success: boolean }>(
      'http://localhost:3000/api/auth/login',
      this.loginData,
      { withCredentials: true }  // Cookie al
    ).subscribe({
      next: (res) => {
        if (res.success) {
          console.log(' Giriş başarılı, token cookie\'de');
          
          this.isLoggedIn = true;
          this.isLoggingIn = false;
          
          this.getUserInfo();
        } else {
          this.isLoggingIn = false;
          alert('Giriş başarısız!');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Login Hatası:', err);
        alert('Kullanıcı adı veya şifre hatalı!');
        this.isLoggingIn = false;
        this.cdr.detectChanges();
      }
    });
  }

  getUserInfo() {
    // Cookie otomatik gider
    this.http.get<{ success: boolean; user: { username: string } }>(
      'http://localhost:3000/api/auth/me',
      { withCredentials: true }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.currentUser = res.user;
          this.loginData.password = '';
          console.log(' Kullanıcı bilgileri alındı:', res.user.username);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(' Kullanıcı bilgisi alınamadı:', err);
        if (this.isLoggedIn) this.logout();
      }
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onUpload() {
    if (!this.selectedFile || this.isUploading) return;

    this.isUploading = true;
    const formData = new FormData();
    formData.append('image', this.selectedFile);

    //  Cookie otomatik gider
    this.http.post('http://localhost:3000/api/analyze', formData, {
      withCredentials: true
    }).subscribe({
      next: (res) => {
        this.result = res;
        this.isUploading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(' Analiz Hatası:', err);
        this.isUploading = false;
        if (err.status === 401) this.logout();
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    console.log('Çıkış yapılıyor...');
    
    //  Backend'e logout isteği gönder (cookie siler)
    this.http.post('http://localhost:3000/api/auth/logout', {}, {
      withCredentials: true
    }).subscribe({
      next: () => {
        console.log(' Cookie silindi');
      },
      error: (err) => {
        console.error('Logout hatası:', err);
      }
    });
    
    this.isLoggedIn = false;
    this.currentUser = null;
    this.result = null;
    this.selectedFile = null;
    this.loginData = { username: '', password: '' };
    
 
    this.cdr.detectChanges();
  }
}