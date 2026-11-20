# Membuat 4 artikel contoh (terbit) lewat API backend. Backend harus sudah berjalan di port 8081.
# Jalankan dari folder frontend:  powershell -ExecutionPolicy Bypass -File .\seed-artikel.ps1
$base = 'http://localhost:8081/api'
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body '{"username":"member","password":"member"}'
$headers = @{ Authorization = "Bearer $($login.data.token)" }

$posts = @(
  @{ title = 'Mengenal Golang untuk Backend'; category = 'Teknologi'
     excerpt = 'Mengapa Go semakin populer untuk membangun REST API yang cepat dan sederhana.'
     content = "# Golang untuk Backend`n`nGo dirancang **sederhana** dan cepat.`n`n- Kompilasi cepat`n- Concurrency bawaan`n- Satu file biner`n`n## Contoh`n`n``````go`nfmt.Println(""Halo Delcom"")`n``````"
     cover_image_path = 'https://picsum.photos/seed/delcom1/800/400'; is_published = $true },
  @{ title = 'Tips Belajar Efektif di Kampus'; category = 'Pendidikan'
     excerpt = 'Cara mengatur waktu dan fokus agar belajar tidak terasa berat.'
     content = "## Tips Belajar`n`n1. Buat jadwal mingguan`n2. Gunakan teknik Pomodoro`n3. Diskusi dengan teman`n`n> Konsistensi mengalahkan intensitas."
     is_published = $true },
  @{ title = 'Gaya Hidup Minimalis ala Mahasiswa'; category = 'Gaya Hidup'
     excerpt = ''
     content = "Hidup minimalis bukan soal **sedikit barang**, tetapi soal *sengaja memilih*.`n`nMulai dari lemari pakaian."
     is_published = $true },
  @{ title = 'Memulai Bisnis Kecil dari Kamar Kos'; category = 'Bisnis'
     excerpt = 'Modal kecil, ide besar: langkah awal membangun usaha pertamamu.'
     content = "# Bisnis dari Kos`n`nMulai dari masalah yang kamu temui sehari-hari."
     is_published = $true }
)

foreach ($p in $posts) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes(($p | ConvertTo-Json -Depth 5))
  $r = Invoke-RestMethod -Method Post -Uri "$base/posts" -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $bytes
  Write-Host "OK: $($r.data.title)"
}
