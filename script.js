// ==============================================
// KONFIGURASI DASAR
// ==============================================
const USER_VALID = {
    "Asset": "Asset",
    "Kernaden17": "Kernaden17"
};

// Zona Waktu Indonesia Barat
function getWIB() {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

// Format tanggal untuk input datetime-local
function formatDateTimeInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ==============================================
// FUNGSI LOGIN
// ==============================================
function login() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    
    if (USER_VALID[user] && USER_VALID[user] === pass) {
        localStorage.setItem("isLogin", "true");
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("mainPage").classList.remove("hidden");
        muatSemuaData();
    } else {
        alert("Username atau Password salah!");
    }
}

function logout() {
    localStorage.removeItem("isLogin");
    document.getElementById("mainPage").classList.add("hidden");
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}

window.onload = function() {
    if (localStorage.getItem("isLogin") === "true") {
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("mainPage").classList.remove("hidden");
        muatSemuaData();
    }
};

// ==============================================
// NAVIGASI & BANTUAN
// ==============================================
function toggleMenu() {
    const menu = document.querySelector(".nav-menu");
    if (menu) menu.classList.toggle("active");
}

function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
    const section = document.getElementById(id);
    if (section) section.classList.remove("hidden");
    
    const menu = document.querySelector(".nav-menu");
    if (menu) menu.classList.remove("active");
}

// Set waktu sekarang ke input
function setWaktuSekarang(inputId) {
    const wib = getWIB();
    const tglStr = formatDateTimeInput(wib);
    const input = document.getElementById(inputId);
    if (input) input.value = tglStr;
}

// Fungsi untuk mengunci/membuka input tanggal
function toggleTglInput(inputId, checkboxId) {
    const input = document.getElementById(inputId);
    const checkbox = document.getElementById(checkboxId);
    if (!input || !checkbox) return;
    
    input.readOnly = !checkbox.checked;
    if (!checkbox.checked) {
        setWaktuSekarang(inputId);
    }
}

function toggleForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.classList.toggle("hidden");
    form.dataset.editId = "";
    
    const btnSimpan = form.querySelector("button[type='button'].btn-success");
    if (btnSimpan) btnSimpan.textContent = "Simpan";
    
    // Reset checkbox tanggal
    const checkboxTgl = form.querySelector('input[type="checkbox"][id^="ubahTgl"]');
    if (checkboxTgl) {
        checkboxTgl.checked = false;
        const inputTgl = form.querySelector('input[type="datetime-local"]');
        if (inputTgl) {
            inputTgl.readOnly = true;
            setWaktuSekarang(inputTgl.id);
        }
    }
}

function resetForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.querySelectorAll("input, select").forEach(el => el.value = "");
    form.dataset.editId = "";
    
    const btnSimpan = form.querySelector("button.btn-success");
    if (btnSimpan) btnSimpan.textContent = "Simpan";
    
    // Reset checkbox tanggal
    const checkboxTgl = form.querySelector('input[type="checkbox"][id^="ubahTgl"]');
    if (checkboxTgl) {
        checkboxTgl.checked = false;
        const inputTgl = form.querySelector('input[type="datetime-local"]');
        if (inputTgl) {
            inputTgl.readOnly = true;
            setWaktuSekarang(inputTgl.id);
        }
    }
    
    form.classList.add("hidden");
}

// ==============================================
// FITUR PENCARIAN BARANG MINIMAL 3 HURUF
// DENGAN NAMA PEKERJA OTOMATIS
// ==============================================
// ==============================================
// FITUR PENCARIAN BARANG + ISI OTOMATIS NAMA PEKERJA & SHIFT
// ==============================================
function cariBarangPinjamOtomatis() {
    const kata = document.getElementById("cariBarangPinjam").value.trim().toLowerCase();
    const daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];
    const hasilContainer = document.getElementById("hasilCariBarangPinjam");
    
    hasilContainer.innerHTML = "";
    if (kata.length < 3) {
        hasilContainer.classList.remove("aktif");
        return;
    }

    const hasil = daftarBarang.filter(item => 
        item.kode.toLowerCase().includes(kata) || 
        item.nama.toLowerCase().includes(kata)
    );

    if (hasil.length === 0) {
        hasilContainer.innerHTML = `<div class="item-cari">Tidak ada barang ditemukan</div>`;
        hasilContainer.classList.add("aktif");
        return;
    }

    hasil.forEach(item => {
        const sisaStok = item.qty - hitungTotalPinjam(item.id);
        const elemen = document.createElement("div");
        elemen.className = "item-cari";
        elemen.innerHTML = `<strong>${item.kode}</strong> - ${item.nama} | Stok Tersedia: ${sisaStok}`;
        elemen.dataset.id = item.id;
        elemen.dataset.kode = item.kode;
        elemen.dataset.nama = item.nama;
        elemen.dataset.pekerja = item.pekerja; // Simpan nama pekerja
        elemen.dataset.shift = item.shift;     // Simpan shift dari data barang
        elemen.dataset.stok = sisaStok;

        elemen.addEventListener("click", function() {
            // Isi data barang
            document.getElementById("cariBarangPinjam").value = `${this.dataset.kode} - ${this.dataset.nama}`;
            document.getElementById("barangTerpilihIdPinjam").value = this.dataset.id;
            document.getElementById("kodeBarangPinjam").value = this.dataset.kode;
            document.getElementById("namaBarangPinjam").value = this.dataset.nama;
            document.getElementById("stokTersediaPinjam").textContent = this.dataset.stok;
            
            // 🔵 ISI OTOMATIS NAMA PEKERJA DARI DATA BARANG
            document.getElementById("pekerjaPinjam").value = this.dataset.pekerja;
            
            // 🟢 ISI OTOMATIS SHIFT DARI DATA BARANG
            const shiftSelect = document.getElementById("shiftPinjam");
            if (shiftSelect) {
                shiftSelect.value = this.dataset.shift;
            }
            
            hasilContainer.classList.remove("aktif");
        });

        hasilContainer.appendChild(elemen);
    });
    hasilContainer.classList.add("aktif");
}

function cariPinjamKembaliOtomatis() {
    const kata = document.getElementById("cariPinjamKembali").value.trim().toLowerCase();
    const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    const hasilContainer = document.getElementById("hasilCariPinjamKembali");
    
    hasilContainer.innerHTML = "";
    if (kata.length < 3) {
        hasilContainer.classList.remove("aktif");
        return;
    }

    const hasil = daftarPinjam.filter(item => {
        const sudahKembali = hitungSudahKembali(item.id);
        return (item.kode.toLowerCase().includes(kata) || 
                item.nama.toLowerCase().includes(kata) ||
                item.pekerja.toLowerCase().includes(kata)) &&
               (item.qty - sudahKembali) > 0;
    });

    if (hasil.length === 0) {
        hasilContainer.innerHTML = `<div class="item-cari">Tidak ada peminjaman aktif ditemukan</div>`;
        hasilContainer.classList.add("aktif");
        return;
    }

    hasil.forEach(item => {
        const sisaPinjam = item.qty - hitungSudahKembali(item.id);
        const elemen = document.createElement("div");
        elemen.className = "item-cari";
        elemen.innerHTML = `<strong>${item.kode}</strong> - ${item.nama} | Peminjam: ${item.pekerja} | Sisa: ${sisaPinjam}`;
        elemen.dataset.id = item.id;
        elemen.dataset.kode = item.kode;
        elemen.dataset.nama = item.nama;
        elemen.dataset.pekerja = item.pekerja;
        elemen.dataset.qty = item.qty;
        elemen.dataset.shift = item.shift;
        elemen.dataset.sisa = sisaPinjam;

        elemen.addEventListener("click", function() {
            document.getElementById("cariPinjamKembali").value = `${this.dataset.kode} - ${this.dataset.nama} (${this.dataset.pekerja})`;
            document.getElementById("pinjamTerpilihIdKembali").value = this.dataset.id;
            document.getElementById("kodeBarangKembali").value = this.dataset.kode;
            document.getElementById("namaBarangKembali").value = this.dataset.nama;
            document.getElementById("pekerjaKembali").value = this.dataset.pekerja;
            document.getElementById("qtyPinjamKembali").value = this.dataset.qty;
            document.getElementById("shiftKembali").value = this.dataset.shift;
            document.getElementById("qtyKembali").max = this.dataset.sisa;
            hasilContainer.classList.remove("aktif");
        });

        hasilContainer.appendChild(elemen);
    });
    hasilContainer.classList.add("aktif");
}

// Tutup pencarian saat klik luar
document.addEventListener("click", function(e) {
    document.querySelectorAll(".hasil-pencarian.aktif").forEach(el => {
        if (!el.parentElement.contains(e.target)) el.classList.remove("aktif");
    });
});

// ==============================================
// DATA BARANG
// ==============================================
function simpanBarang() {
    const form = document.getElementById("formBarang");
    const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;

    const kode = document.getElementById("kodeBarang").value.trim();
    const pekerja = document.getElementById("pekerjaBarang").value.trim();
    const nama = document.getElementById("namaBarang").value.trim();
    const qtyBaru = parseInt(document.getElementById("qtyBarang").value);
    const shift = document.getElementById("shiftBarang").value.trim();
    const lokasi = document.getElementById("lokasiBarang").value.trim();
    const tanggal = document.getElementById("tglBarang").value || formatDateTimeInput(getWIB());

    if (!kode || !nama || !pekerja || isNaN(qtyBaru) || qtyBaru <= 0 || !shift) {
        alert("Semua kolom wajib diisi dengan benar!");
        return;
    }

    const data = { 
        id: editId || Date.now(), 
        tanggal, 
        kode, 
        pekerja, 
        nama, 
        qty: qtyBaru, 
        shift,
        lokasi
    };
    
    let daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];

    if (editId) {
        // ✅ Validasi: stok tidak boleh kurang dari total yang sudah dipinjam
        const totalSudahDipinjam = hitungTotalPinjam(editId);
        if (qtyBaru < totalSudahDipinjam) {
            alert(`Tidak bisa mengurangi stok! Barang sudah dipinjam sebanyak ${totalSudahDipinjam} unit. Stok minimal harus ${totalSudahDipinjam}`);
            return;
        }

        const index = daftarBarang.findIndex(b => b.id === editId);
        daftarBarang[index] = data;
        alert("Data barang berhasil diperbarui! Perhitungan stok dan status sudah diperbarui otomatis.");
    } else {
        daftarBarang.push(data);
        alert("Data barang berhasil ditambahkan!");
    }

    localStorage.setItem("dataBarang", JSON.stringify(daftarBarang));
    resetForm("formBarang");
    
    // 🔄 Perbarui SEMUA tampilan setelah edit
    tampilkanBarang();
    tampilkanPeminjaman();
    tampilkanPengembalian();
}

function tampilkanBarang() {
    const daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];
    const tbody = document.querySelector("#tabelBarang tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    daftarBarang.forEach((item, i) => {
        const masihDipinjam = hitungTotalPinjam(item.id);
        const sisaStok = item.qty - masihDipinjam;
        const tgl = new Date(item.tanggal).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        const baris = document.createElement("tr");
        baris.innerHTML = `
            <td>${i+1}</td>
            <td>${tgl}</td>
            <td>${item.kode}</td>
            <td>${item.pekerja}</td>
            <td>${item.nama}</td>
            <td>${item.qty}</td>
            <td>${masihDipinjam}</td>
            <td><strong>${sisaStok}</strong></td>
            <td>${item.shift}</td>
            <td>${item.lokasi || "-"}</td>
            <td>
                <button class="btn btn-edit" onclick="bukaEditBarang(${item.id})">Edit</button>
                <button class="btn btn-hapus" onclick="hapusBarang(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
}

// ✅ Selalu hitung ulang setiap kali dipanggil, tidak disimpan statis
function hitungTotalPinjam(barangId) {
    const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    const daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
    
    // Total yang dipinjam
    const totalKeluar = daftarPinjam
        .filter(p => p.barangId === barangId)
        .reduce((sum, p) => sum + p.qty, 0);
    
    // Total yang sudah dikembalikan
    const totalMasuk = daftarKembali
        .filter(k => {
            const pinjam = daftarPinjam.find(p => p.id === k.pinjamId);
            return pinjam && pinjam.barangId === barangId;
        })
        .reduce((sum, k) => sum + k.qty, 0);

    // Sisa yang masih dipinjam
    return totalKeluar - totalMasuk;
}

function bukaEditBarang(id) {
    const daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];
    const data = daftarBarang.find(b => b.id === id);
    if (!data) return;

    document.getElementById("tglBarang").value = data.tanggal;
    document.getElementById("kodeBarang").value = data.kode;
    document.getElementById("pekerjaBarang").value = data.pekerja;
    document.getElementById("namaBarang").value = data.nama;
    document.getElementById("qtyBarang").value = data.qty;
    document.getElementById("shiftBarang").value = data.shift;
    document.getElementById("lokasiBarang").value = data.lokasi || "";

    const form = document.getElementById("formBarang");
    form.dataset.editId = id;
    form.querySelector("button.btn-success").textContent = "Perbarui";
    form.classList.remove("hidden");
    form.scrollIntoView({behavior:"smooth"});
}

function hapusBarang(id) {
    const totalPinjam = hitungTotalPinjam(id);
    if (totalPinjam > 0) {
        alert("Tidak bisa dihapus! Barang masih ada yang dipinjam.");
        return;
    }
    if (!confirm("Yakin hapus data barang?")) return;

    let daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];
    daftarBarang = daftarBarang.filter(b => b.id !== id);
    localStorage.setItem("dataBarang", JSON.stringify(daftarBarang));
    tampilkanBarang();
}

function cariBarang() {
    const kata = document.getElementById("searchBarang")?.value.toLowerCase().trim() || "";
    const daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];
    const hasil = kata ? daftarBarang.filter(b => 
        b.nama.toLowerCase().includes(kata) || 
        b.kode.toLowerCase().includes(kata) ||
        b.pekerja.toLowerCase().includes(kata) ||
        b.shift.toLowerCase().includes(kata) ||
        (b.lokasi && b.lokasi.toLowerCase().includes(kata))
    ) : daftarBarang;
    tampilkanBarangTabel(hasil);
}

function tampilkanBarangTabel(data) {
    const tbody = document.querySelector("#tabelBarang tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    data.forEach((item, i) => {
        const totalPinjam = hitungTotalPinjam(item.id);
        const sisaStok = item.qty - totalPinjam;
        const tgl = new Date(item.tanggal).toLocaleString("id-ID", {timeZone: "Asia/Jakarta"});
        
        const baris = document.createElement("tr");
        baris.innerHTML = `
            <td>${i+1}</td>
            <td>${tgl}</td>
            <td>${item.kode}</td>
            <td>${item.pekerja}</td>
            <td>${item.nama}</td>
            <td>${item.qty}</td>
            <td>${totalPinjam}</td>
            <td>${sisaStok}</td>
            <td>${item.shift}</td>
            <td>${item.lokasi || "-"}</td>
            <td>
                <button class="btn btn-edit" onclick="bukaEditBarang(${item.id})">Edit</button>
                <button class="btn btn-hapus" onclick="hapusBarang(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
}

// ==============================================
// DATA PEMINJAMAN
// ==============================================
function simpanPeminjaman() {
    const tanggal = document.getElementById("tglPinjam").value || formatDateTimeInput(getWIB());
    const barangId = parseInt(document.getElementById("barangTerpilihIdPinjam").value);
    const kode = document.getElementById("kodeBarangPinjam").value;
    const nama = document.getElementById("namaBarangPinjam").value;
    const pekerja = document.getElementById("pekerjaPinjam").value.trim();
    const qty = parseInt(document.getElementById("qtyPinjam").value);
    const shift = document.getElementById("shiftPinjam").value;
    const stokTersedia = parseInt(document.getElementById("stokTersediaPinjam").textContent);

    if (!barangId || !kode || !nama || !pekerja || !qty || !shift) {
        alert("Semua kolom wajib diisi!");
        return;
    }
    if (qty <= 0) {
        alert("Jumlah harus lebih dari 0!");
        return;
    }
    if (qty > stokTersedia) {
        alert(`Stok tidak cukup! Maksimal bisa dipinjam: ${stokTersedia}`);
        return;
    }

    const data = {
        id: Date.now(),
        tanggal,
        barangId,
        kode,
        nama,
        pekerja,
        qty,
        shift
    };

    const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    daftarPinjam.push(data);
    localStorage.setItem("dataPeminjaman", JSON.stringify(daftarPinjam));

    alert("Data peminjaman berhasil disimpan!");
    resetForm("formPinjam");
    tampilkanPeminjaman();
    tampilkanBarang();
}

function tampilkanPeminjaman() {
    const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    const tbody = document.querySelector("#tabelPeminjaman tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    daftarPinjam.forEach((item, i) => {
        const tgl = new Date(item.tanggal).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
        const sudahKembali = hitungSudahKembali(item.id);
        const status = sudahKembali >= item.qty 
            ? "✅ Selesai" 
            : `🔄 Belum Selesai (Sisa: ${item.qty - sudahKembali})`;

        const baris = document.createElement("tr");
        baris.innerHTML = `
            <td>${i+1}</td>
            <td>${tgl}</td>
            <td>${item.kode}</td>
            <td>${item.pekerja}</td>
            <td>${item.nama}</td>
            <td>${item.qty}</td>
            <td>${sudahKembali}</td>
            <td>${status}</td>
            <td>${item.shift}</td>
            <td>
                <button class="btn btn-hapus" onclick="hapusPinjam(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
}

function hapusPinjam(id) {
    const sudahKembali = hitungSudahKembali(id);
    if (sudahKembali > 0) {
        alert("Tidak bisa dihapus! Sudah ada yang dikembalikan.");
        return;
    }
    if (!confirm("Yakin hapus data peminjaman?")) return;

    let daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    daftarPinjam = daftarPinjam.filter(p => p.id !== id);
    localStorage.setItem("dataPeminjaman", JSON.stringify(daftarPinjam));
    tampilkanPeminjaman();
    tampilkanBarang();
}

function hitungSudahKembali(pinjamId) {
    const daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
    return daftarKembali.filter(k => k.pinjamId === pinjamId).reduce((s, k) => s + k.qty, 0);
}

function cariPeminjaman() {
    const kata = document.getElementById("searchPeminjaman")?.value.toLowerCase().trim() || "";
    const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    const hasil = kata ? daftarPinjam.filter(p => 
        p.nama.toLowerCase().includes(kata) || 
        p.kode.toLowerCase().includes(kata) ||
        p.pekerja.toLowerCase().includes(kata)
    ) : daftarPinjam;
    tampilkanPinjamTabel(hasil);
}

function tampilkanPinjamTabel(data) {
    const tbody = document.querySelector("#tabelPeminjaman tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    data.forEach((item, i) => {
        const tgl = new Date(item.tanggal).toLocaleString("id-ID", {timeZone: "Asia/Jakarta"});
        const sudahKembali = hitungSudahKembali(item.id);
        const status = sudahKembali >= item.qty ? "✅ Selesai" : "🔄 Belum Selesai";
        
        const baris = document.createElement("tr");
        baris.innerHTML = `
            <td>${i+1}</td>
            <td>${tgl}</td>
            <td>${item.kode}</td>
            <td>${item.pekerja}</td>
            <td>${item.nama}</td>
            <td>${item.qty}</td>
            <td>${sudahKembali}</td>
            <td>${status}</td>
            <td>${item.shift}</td>
            <td>
                <button class="btn btn-hapus" onclick="hapusPinjam(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
}

function updatePilihanBarang() {}
function isiDataBarangPinjam() {}

// ==============================================
// DATA PENGEMBALIAN
// ==============================================
function simpanPengembalian() {
    const tanggal = document.getElementById("tglKembali").value || formatDateTimeInput(getWIB());
    const pinjamId = parseInt(document.getElementById("pinjamTerpilihIdKembali").value);
    const kode = document.getElementById("kodeBarangKembali").value;
    const nama = document.getElementById("namaBarangKembali").value;
    const pekerja = document.getElementById("pekerjaKembali").value;
    const qtyPinjam = parseInt(document.getElementById("qtyPinjamKembali").value);
    const qtyKembali = parseInt(document.getElementById("qtyKembali").value);
    const shift = document.getElementById("shiftKembali").value;

    if (!pinjamId || !kode || !nama || !pekerja || !qtyKembali || !shift) {
        alert("Semua kolom wajib diisi!");
        return;
    }
    if (qtyKembali <= 0) {
        alert("Jumlah kembali harus lebih dari 0!");
        return;
    }
    const sudahKembali = hitungSudahKembali(pinjamId);
    const sisaBisaKembali = qtyPinjam - sudahKembali;
    if (qtyKembali > sisaBisaKembali) {
        alert(`Maksimal bisa dikembalikan: ${sisaBisaKembali}`);
        return;
    }

    const data = {
        id: Date.now(),
        pinjamId,
        tanggal,
        kode,
        nama,
        pekerja,
        qty: qtyKembali,
        shift
    };

    const daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
    daftarKembali.push(data);
    localStorage.setItem("dataPengembalian", JSON.stringify(daftarKembali));

    alert("Data pengembalian berhasil disimpan!");
    resetForm("formKembali");
    tampilkanPengembalian();
    tampilkanPeminjaman();
    tampilkanBarang();
}

function tampilkanPengembalian() {
    const daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
    const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    const tbody = document.querySelector("#tabelPengembalian tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    daftarKembali.forEach((item, i) => {
        const dataPinjam = daftarPinjam.find(p => p.id === item.pinjamId) || {};
        const tglPinjam = dataPinjam.tanggal ? new Date(dataPinjam.tanggal).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta", year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }) : "-";
        const tglKembali = new Date(item.tanggal).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta", year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        const baris = document.createElement("tr");
        baris.innerHTML = `
            <td>${i+1}</td>
            <td>${tglPinjam}</td>
            <td>${tglKembali}</td>
            <td>${item.kode}</td>
            <td>${item.pekerja}</td>
            <td>${item.nama}</td>
            <td>${item.qty}</td>
            <td>${item.shift}</td>
            <td>
                <button class="btn btn-hapus" onclick="hapusKembali(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
}

function hapusKembali(id) {
    if (!confirm("Yakin hapus data pengembalian?")) return;

    let daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
    daftarKembali = daftarKembali.filter(k => k.id !== id);
    localStorage.setItem("dataPengembalian", JSON.stringify(daftarKembali));
    
    tampilkanPengembalian();
    tampilkanPeminjaman();
    tampilkanBarang();
}

function cariPengembalian() {
    const kata = document.getElementById("searchPengembalian")?.value.toLowerCase().trim() || "";
    const daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
    const hasil = kata ? daftarKembali.filter(k => 
        k.nama.toLowerCase().includes(kata) || 
        k.kode.toLowerCase().includes(kata) ||
        k.pekerja.toLowerCase().includes(kata)
    ) : daftarKembali;
    tampilkanKembaliTabel(hasil);
}

function tampilkanKembaliTabel(data) {
    const tbody = document.querySelector("#tabelPengembalian tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    data.forEach((item, i) => {
        const dataPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
        const tglPinjam = dataPinjam.find(p => p.id === item.pinjamId)?.tanggal 
            ? new Date(dataPinjam.find(p => p.id === item.pinjamId).tanggal).toLocaleString("id-ID", {timeZone: "Asia/Jakarta"}) 
            : "-";
        const tglKembali = new Date(item.tanggal).toLocaleString("id-ID", {timeZone: "Asia/Jakarta"});
        
        const baris = document.createElement("tr");
        baris.innerHTML = `
            <td>${i+1}</td>
            <td>${tglPinjam}</td>
            <td>${tglKembali}</td>
            <td>${item.kode}</td>
            <td>${item.pekerja}</td>
            <td>${item.nama}</td>
            <td>${item.qty}</td>
            <td>${item.shift}</td>
            <td>
                <button class="btn btn-hapus" onclick="hapusKembali(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
}

function updatePilihanPinjam() {}
function isiDataPinjamKembali() {}

// ==============================================
// CETAK LAPORAN
// ==============================================
function formatTanggalFile(tanggal) {
    const d = new Date(tanggal);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function formatTanggalTabel(tanggal) {
    const d = new Date(tanggal);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function cetakPerItem(jenis) {
    let data, judul, kolom;
    if (jenis === "barang") {
        data = JSON.parse(localStorage.getItem("dataBarang")) || [];
        judul = "LOG DATA BARANG";
        kolom = ["NO", "TANGGAL", "KODE", "NAMA PEKERJA", "NAMA BARANG", "JUMLAH AWAL", "DIPINJAM", "SISA STOK", "SHIFT", "LOKASI"];
        data = data.map((b,i) => ({
            no:i+1,
            tanggal: new Date(b.tanggal).toLocaleDateString("id-ID"),
            kode:b.kode, pekerja:b.pekerja, nama:b.nama,
            qty:b.qty, pinjam:hitungTotalPinjam(b.id), sisa:b.qty - hitungTotalPinjam(b.id), shift:b.shift, lokasi:b.lokasi || "-"
        }));
    } else if (jenis === "peminjaman") {
        data = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
        judul = "LOG BARANG PEMINJAMAN";
        kolom = ["NO", "TANGGAL", "KODE", "NAMA BARANG", "NAMA PEKERJA", "DIPINJAM", "SUDAH KEMBALI", "SHIFT"];
        data = data.map((p,i) => ({
            no:i+1,
            tanggal: new Date(p.tanggal).toLocaleDateString("id-ID"),
            kode:p.kode, nama:p.nama, pekerja:p.pekerja,
            qty:p.qty, kembali:hitungSudahKembali(p.id), shift:p.shift
        }));
    } else {
        data = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
        judul = "LOG BARANG PENGEMBALIAN";
        kolom = ["NO", "TANGGAL PINJAM", "TANGGAL KEMBALI", "KODE", "NAMA BARANG", "NAMA PEKERJA", "DIKEMBALIKAN", "SHIFT"];
        data = data.map((k,i) => {
            const pinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
            const dataPinjam = pinjam.find(p => p.id === k.pinjamId) || {};
            return {
                no:i+1,
                tglPinjam: dataPinjam.tanggal ? new Date(dataPinjam.tanggal).toLocaleDateString("id-ID") : "-",
                tglKembali: new Date(k.tanggal).toLocaleDateString("id-ID"),
                kode:k.kode, nama:k.nama, pekerja:k.pekerja,
                qty:k.qty, shift:k.shift
            };
        });
    }
    cetakPDF(judul, kolom, data);
}

function cetakPeriode(tipe) {
    const tglMulai = new Date(document.getElementById("tglMulai")?.value);
    const tglSelesai = new Date(document.getElementById("tglSelesai")?.value);
    
    if (isNaN(tglMulai.getTime()) || isNaN(tglSelesai.getTime())) {
        alert("Tanggal mulai dan selesai harus diisi dengan benar!");
        return;
    }

    const filterTgl = (arr) => arr.filter(i => {
        const t = new Date(i.tanggal);
        return t >= tglMulai && t <= new Date(tglSelesai.setHours(23,59,59));
    });

    const data = {
        barang: filterTgl(JSON.parse(localStorage.getItem("dataBarang")) || []),
        pinjam: filterTgl(JSON.parse(localStorage.getItem("dataPeminjaman")) || []),
        kembali: filterTgl(JSON.parse(localStorage.getItem("dataPengembalian")) || [])
    };

    if (tipe === "pdf") cetakPDFKeseluruhan(data, tglMulai, tglSelesai);
    if (tipe === "excel") cetakExcel(data, tglMulai, tglSelesai);
}

function cetakPDF(judul, kolom, data) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Library jsPDF belum dimuat!");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Aplikasi Peminjaman & Pengembalian Barang", 105, 15, {align:"center"});
    doc.setFontSize(12);
    doc.text("PT. AKMAL JAYA SENTOSA", 105, 22, {align:"center"});
    doc.text(judul, 105, 30, {align:"center"});
    doc.line(14,34,196,34);

    doc.autoTable({
        startY:40,
        head:[kolom],
        body:data.map(r => Object.values(r)),
        theme:"grid",
        headStyles:{fillColor:[240,240,240], textColor:0},
        styles:{fontSize:8, cellPadding:2}
    });

    const namaFile = `${judul}_${formatTanggalFile(new Date())}.pdf`;
    doc.save(namaFile);
}

function cetakPDFKeseluruhan(data, mulai, selesai) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Library jsPDF belum dimuat!");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("LAPORAN KESELURUHAN", 105, 15, {align:"center"});
    doc.setFontSize(12);
    doc.text(`Periode: ${mulai.toLocaleDateString("id-ID")} s/d ${selesai.toLocaleDateString("id-ID")}`, 105, 22, {align:"center"});
    doc.line(14,26,196,26);

    let y = 35;
    if (data.barang.length) {
        doc.setFontSize(11); doc.text("LOG DATA BARANG", 14, y); y += 6;
        doc.autoTable({
            startY:y,
            head:[["NO","TANGGAL","KODE","NAMA PEKERJA","NAMA BARANG","JUMLAH","DIPINJAM","SISA STOK","SHIFT","LOKASI"]],
            body:data.barang.map((b,i) => [
                i+1, new Date(b.tanggal).toLocaleDateString("id-ID"), b.kode, b.pekerja, b.nama, 
                b.qty, hitungTotalPinjam(b.id), b.qty - hitungTotalPinjam(b.id), b.shift, b.lokasi || "-"
            ]),
            theme:"grid", styles:{fontSize:8}
        });
        y = doc.lastAutoTable.finalY + 10;
    }
    if (data.pinjam.length) {
        doc.setFontSize(11); doc.text("LOG BARANG PEMINJAMAN", 14, y); y += 6;
        doc.autoTable({
            startY:y,
            head:[["NO","TANGGAL","KODE","NAMA PEKERJA","NAMA BARANG","DIPINJAM","SUDAH KEMBALI","SHIFT"]],
            body:data.pinjam.map((p,i) => [
                i+1, new Date(p.tanggal).toLocaleDateString("id-ID"), p.kode, p.pekerja, p.nama, 
                p.qty, hitungSudahKembali(p.id), p.shift
            ]),
            theme:"grid", styles:{fontSize:8}
        });
        y = doc.lastAutoTable.finalY + 10;
    }
    if (data.kembali.length) {
        doc.setFontSize(11); doc.text("LOG BARANG PENGEMBALIAN", 14, y); y += 6;
        doc.autoTable({
            startY:y,
            head:[["NO","TANGGAL PINJAM","TANGGAL KEMBALI","KODE","NAMA BARANG","NAMA PEKERJA","DIKEMBALIKAN","SHIFT"]],
            body:data.kembali.map((k,i) => {
                const pinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
                const dataPinjam = pinjam.find(p => p.id === k.pinjamId) || {};
                return [
                    i+1, dataPinjam.tanggal ? new Date(dataPinjam.tanggal).toLocaleDateString("id-ID") : "-",
                    new Date(k.tanggal).toLocaleDateString("id-ID"), k.kode, k.nama, k.pekerja, k.qty, k.shift
                ];
            }),
            theme:"grid", styles:{fontSize:8}
        });
    }

    const namaFile = `LAPORAN_${formatTanggalFile(mulai)}_sd_${formatTanggalFile(selesai)}.pdf`;
    doc.save(namaFile);
}

function cetakExcel(data, mulai, selesai) {
    if (!window.XLSX) {
        alert("Library SheetJS/XLSX belum dimuat!");
        return;
    }

    const wb = XLSX.utils.book_new();
    const periodeTeks = `Periode: ${formatTanggalTabel(mulai)} s/d ${formatTanggalTabel(selesai)}`;
    let sheetData = [];

    sheetData.push(["LAPORAN KESELURUHAN"]);
    sheetData.push([periodeTeks]);
    sheetData.push([]);
    sheetData.push([]);

    if (data.barang.length > 0) {
        sheetData.push(["LOG BARANG MASUK"]);
        sheetData.push([]);
        const headerMasuk = ["NO", "TANGGAL", "KODE", "PEKERJA", "NAMA", "JUMLAH", "DIPINJAM", "SISA STOK", "SHIFT", "LOKASI"];
        sheetData.push(headerMasuk);
        data.barang.forEach((item, index) => {
            const totalPinjam = hitungTotalPinjam(item.id);
            const sisaStok = item.qty - totalPinjam;
            sheetData.push([
                index + 1, formatTanggalTabel(item.tanggal), item.kode, item.pekerja, item.nama,
                item.qty, totalPinjam, sisaStok, item.shift, item.lokasi || "-"
            ]);
        });
        sheetData.push([]);
        sheetData.push([]);
    }

    if (data.pinjam.length > 0) {
        sheetData.push(["LOG BARANG KELUAR"]);
        sheetData.push([]);
        const headerKeluar = ["NO", "TANGGAL", "KODE", "NAMA", "PEMINJAM", "DIPINJAM", "SUDAH KEMBALI", "SHIFT"];
        sheetData.push(headerKeluar);
        data.pinjam.forEach((item, index) => {
            const sudahKembali = hitungSudahKembali(item.id);
            sheetData.push([
                index + 1, formatTanggalTabel(item.tanggal), item.kode, item.nama,
                item.pekerja, item.qty, sudahKembali, item.shift
            ]);
        });
        sheetData.push([]);
        sheetData.push([]);
    }

    if (data.kembali.length > 0) {
        sheetData.push(["LOG BARANG PENGEMBALIAN"]);
        sheetData.push([]);
        const headerKembali = ["NO", "TANGGAL PINJAM", "TANGGAL KEMBALI", "KODE", "NAMA", "PEMINJAM", "DIKEMBALIKAN", "SHIFT"];
        sheetData.push(headerKembali);
        data.kembali.forEach((item, index) => {
            const pinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
            const dataPinjam = pinjam.find(p => p.id === item.pinjamId) || {};
            sheetData.push([
                index + 1,
                dataPinjam.tanggal ? formatTanggalTabel(dataPinjam.tanggal) : "-",
                formatTanggalTabel(item.tanggal),
                item.kode, item.nama, item.pekerja, item.qty, item.shift
            ]);
        });
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
        { wch: 4 }, { wch: 11 }, { wch: 10 }, { wch: 18 }, { wch: 15 },
        { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "LAPORAN");
    const namaFile = `LAPORAN_${formatTanggalFile(mulai)}_sd_${formatTanggalFile(selesai)}.xlsx`;
    XLSX.writeFile(wb, namaFile);
}

function cetakExcelPerItem(jenis) {
    if (!window.XLSX) {
        alert("Library SheetJS/XLSX belum dimuat!");
        return;
    }

    const wb = XLSX.utils.book_new();
    let judul = "", header = [], data = [];

    if (jenis === "barang") {
        judul = "LOG DATA BARANG";
        header = ["NO", "TANGGAL", "KODE", "NAMA PEKERJA", "NAMA BARANG", "JUMLAH", "DIPINJAM", "SISA STOK", "SHIFT", "LOKASI"];
        const daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];
        data = daftarBarang.map((item, i) => [
            i + 1, formatTanggalTabel(item.tanggal), item.kode, item.pekerja, item.nama,
            item.qty, hitungTotalPinjam(item.id), item.qty - hitungTotalPinjam(item.id), item.shift, item.lokasi || "-"
        ]);
    } else if (jenis === "peminjaman") {
        judul = "LOG BARANG PEMINJAMAN";
        header = ["NO", "TANGGAL", "KODE", "NAMA BARANG", "NAMA PEKERJA", "DIPINJAM", "SUDAH KEMBALI", "SHIFT"];
        const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
        
        data = daftarPinjam.map((item, i) => {
            const sudahKembali = hitungSudahKembali(item.id);
            return [
                i + 1,
                formatTanggalTabel(item.tanggal),
                item.kode,
                item.nama,
                item.pekerja,
                item.qty,
                sudahKembali,
                item.shift
            ];
        });

    } else if (jenis === "pengembalian") {
        judul = "LOG BARANG PENGEMBALIAN";
        header = ["NO", "TANGGAL PINJAM", "TANGGAL KEMBALI", "KODE", "NAMA BARANG", "NAMA PEKERJA", "DIKEMBALIKAN", "SHIFT"];
        const daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
        const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
        
        data = daftarKembali.map((item, i) => {
            const dataPinjam = daftarPinjam.find(p => p.id === item.pinjamId) || {};
            return [
                i + 1,
                dataPinjam.tanggal ? formatTanggalTabel(dataPinjam.tanggal) : "-",
                formatTanggalTabel(item.tanggal),
                item.kode,
                item.nama,
                item.pekerja,
                item.qty,
                item.shift
            ];
        });
    }

    const sheetData = [
        [judul],
        [],
        header,
        ...data
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
        { wch: 4 }, { wch: 11 }, { wch: 10 }, { wch: 18 },
        { wch: 15 }, { wch: 11 }, { wch: 12 }, { wch: 8 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, judul);
    const namaFile = `${judul}_${formatTanggalFile(new Date())}.xlsx`;
    XLSX.writeFile(wb, namaFile);
}

// ==============================================
// MUAT SEMUA DATA SAAT HALAMAN DIBUKA
// ==============================================
function muatSemuaData() {
    tampilkanBarang();
    tampilkanPeminjaman();
    tampilkanPengembalian();
}

// ==============================================
// AKHIR KODE
// ==============================================