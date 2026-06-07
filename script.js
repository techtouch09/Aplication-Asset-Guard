// 1. DATABASE & STATE
let db = JSON.parse(localStorage.getItem('db_rmi')) || { 
    "tab-barang": [], "tab-peminjaman": [], "tab-pengembalian": [] 
};
let currentTab = "tab-barang";

// 2. AUTENTIKASI
function checkAuth() {
    if (localStorage.getItem('auth') !== 'true') {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    } else {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        renderForm();
        renderTable();
    }
}

document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    if(document.getElementById('username').value === 'GUDANG' && document.getElementById('password').value === 'Kernaden17') {
        localStorage.setItem('auth', 'true');
        location.reload();
    } else alert('Username/Password Salah!');
};

function logout() { localStorage.removeItem('auth'); location.reload(); }

// 3. LOGIKA CRUD & CETAK LAPORAN
function autofillBarangDetail() {
    const selectedName = document.getElementById('in-nama').value;
    const barangData = db['tab-barang'].find(b => b.nama === selectedName);
    if (barangData) {
        if (document.getElementById('in-pekerja')) document.getElementById('in-pekerja').value = barangData.pekerja;
        if (document.getElementById('in-kode')) document.getElementById('in-kode').value = barangData.kode;
    }
}

function saveData() {
    const namaBarang = document.getElementById('in-nama').value;
    if (!namaBarang) return alert("Pilih nama barang!");
    const masterBarang = db['tab-barang'].find(b => b.nama === namaBarang) || {};
    
    const newData = {
        tgl: document.getElementById('in-tgl')?.value || new Date().toISOString().split('T')[0],
        kode: masterBarang.kode || document.getElementById('in-kode')?.value || '-',
        nama: namaBarang,
        pekerja: document.getElementById('in-pekerja')?.value || masterBarang.pekerja || '-',
        lokasi: masterBarang.lokasi || document.getElementById('in-lokasi')?.value || '-',
        status: document.getElementById('in-status')?.value || '-'
    };
    
    db[currentTab].push(newData);
    localStorage.setItem('db_rmi', JSON.stringify(db));
    alert('Data Berhasil Disimpan!');
    renderForm();
    renderTable();
}

function deleteData(idx) {
    if (confirm("Yakin ingin menghapus data ini? Jika ini adalah Data Barang, maka seluruh riwayat peminjaman dan pengembalian barang ini akan ikut terhapus!")) {
        
        // Jika yang dihapus adalah dari tab-barang
        if (currentTab === 'tab-barang') {
            const namaBarangYangDihapus = db['tab-barang'][idx].nama;
            
            // Hapus dari master
            db['tab-barang'].splice(idx, 1);
            
            // Hapus semua data terkait di tab-peminjaman
            db['tab-peminjaman'] = db['tab-peminjaman'].filter(item => item.nama !== namaBarangYangDihapus);
            
            // Hapus semua data terkait di tab-pengembalian
            db['tab-pengembalian'] = db['tab-pengembalian'].filter(item => item.nama !== namaBarangYangDihapus);
            
            alert(`Barang "${namaBarangYangDihapus}" dan seluruh riwayatnya telah dihapus.`);
        } else {
            // Jika hapus dari tab lain (peminjaman/pengembalian), hapus seperti biasa
            db[currentTab].splice(idx, 1);
        }

        // Simpan ke localStorage
        localStorage.setItem('db_rmi', JSON.stringify(db));
        
        // Render ulang tabel
        renderTable();
        // Render ulang form (untuk memperbarui dropdown pilihan barang)
        renderForm();
    }
}

function editData(idx) {
    const item = db[currentTab][idx];
    document.getElementById('form-container-box').classList.remove('hidden');
    
    if(document.getElementById('in-tgl')) document.getElementById('in-tgl').value = item.tgl;
    if(document.getElementById('in-nama')) document.getElementById('in-nama').value = item.nama;
    if(document.getElementById('in-kode')) document.getElementById('in-kode').value = item.kode;
    if(document.getElementById('in-pekerja')) document.getElementById('in-pekerja').value = item.pekerja;
    if(document.getElementById('in-lokasi')) document.getElementById('in-lokasi').value = item.lokasi;
    
    db[currentTab].splice(idx, 1);
    localStorage.setItem('db_rmi', JSON.stringify(db));
    renderTable();
}

function printPerItem(idx) {
    const item = db[currentTab][idx];
    
    // Fungsi untuk mengubah format tanggal dari YYYY-MM-DD ke DD/MM/YYYY
    // Fungsi pembantu untuk konversi format
const formatDate = (dateStr) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr || '-';
    // Memecah YYYY-MM-DD menjadi [YYYY, MM, DD]
    const [year, month, day] = dateStr.split('-');
    // Mengembalikan format DD/MM/YYYY
    return `${day}/${month}/${year}`;
};

    const printWindow = window.open('', '_blank');
    
   printWindow.document.write(`
    <html>
    <head>
        <title>Slip Data - ${item.nama}</title>
        <style>
            body { font-family: 'Arial', sans-serif; padding: 30px; color: #000; }
            .header-print { text-align: center; margin-bottom: 20px; }
            .header-print h2 { margin: 0; text-transform: uppercase; }
            .header-print h3 { margin: 5px 0; font-weight: normal; }
            .garis-tebal { border-top: 3px solid #000; margin: 10px 0; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; }
            th { background: #f2f2f2; width: 35%; }
            
            .footer { margin-top: 40px; text-align: right; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header-print">
            <h2>REKAP DATA STOREMAN - ITEM</h2>
            <h3>PT. AKMAL JAYA SENTOSA - LOGISTIK & PERGUDANGAN</h3>
        </div>
        <div class="garis-tebal"></div>

        <table>
    <tr><th style="width: 40%;">NO. SLIP</th><td>SLIP-00${idx + 1}</td></tr>
    
    <tr><th>TANGGAL</th><td>${formatDate(item.tgl)}</td></tr>
    <tr><th>KODE</th><td>${item.kode || '-'}</td></tr>
    <tr><th>NAMA BARANG</th><td>${item.nama || '-'}</td></tr>
    <tr><th>PEKERJA</th><td>${item.pekerja || '-'}</td></tr>
    <tr><th>LOKASI</th><td>${item.lokasi || '-'}</td></tr>
    <tr><th>STATUS</th><td>${item.status || '-'}</td></tr>
</table>

        <div class="footer">
            <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID')}</p>
        </div>

        <script>
            window.onload = () => {
                window.print();
                window.close();
            };
        </script>
    </body>
    </html>`);
    
    printWindow.document.close();
}

// 1. Fungsi Format Tanggal Global
const formatDate = (dateStr) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr || '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

function cetakLaporanDariFilter() {
    const tglMulai = document.getElementById('filter-tgl-mulai').value;
    const tglSelesai = document.getElementById('filter-tgl-selesai').value;

    if (!tglMulai || !tglSelesai) {
        alert("Silakan pilih rentang tanggal terlebih dahulu!");
        return;
    }

    // Mengambil data dari variabel global db
    const dataPeminjaman = db['tab-peminjaman'] || [];
    const dataPengembalian = db['tab-pengembalian'] || [];

    // Filter data berdasarkan rentang tanggal
    const filteredPinjam = dataPeminjaman.filter(item => item.tgl >= tglMulai && item.tgl <= tglSelesai);
    const filteredKembali = dataPengembalian.filter(item => item.tgl >= tglMulai && item.tgl <= tglSelesai);

    const win = window.open('', '_blank');
    
    win.document.write(`
    <html>
<head>
    <title>Laporan Peminjaman & Pengembalian - RMI</title>
    <style>
        /* Menggunakan font yang bersih dan profesional */
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; line-height: 1.4; }
        
        /* Header Laporan yang Rapi */
        .header-print { text-align: center; margin-bottom: 25px; }
        .header-print h2 { margin: 0; font-size: 18px; font-weight: bold; text-transform: uppercase; color: #000; }
        .header-print h3 { margin: 5px 0; font-size: 14px; font-weight: normal; color: #555; }
        .periode { font-size: 13px; font-style: italic; color: #666; margin-top: 5px; }
        
        /* Garis Pemisah yang Tebal dan Profesional */
        .garis-tebal { border-top: 3px solid #333; margin: 15px 0 20px 0; }
        
        /* Gaya Tabel yang Bersih */
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; table-layout: fixed; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
        
        /* Header Tabel (Gray Background) */
        th { background-color: #f8f9fa; font-weight: bold; color: #000; text-transform: uppercase; }
        
        /* Judul Tabel yang Jelas */
        h3.judul-tabel { text-align: left; font-size: 14px; font-weight: bold; margin-bottom: 10px; border-left: 5px solid #2980b9; padding-left: 10px; color: #2c3e50; }
        
        /* Baris Alternatif untuk Kemudahan Membaca (Opsional) */
        tr:nth-child(even) { background-color: #fdfdfd; }
    </style>
</head>
<body>
    <div class="header-print">
        <h2>Rekap Data Asset Guard</h2>
        <h3>PT. AKMAL JAYA SENTOSA - LOGISTIK & PERGUDANGAN</h3>
        <p class="periode">Periode: ${formatDate(tglMulai)} s/d ${formatDate(tglSelesai)}</p>
    </div>
    <div class="garis-tebal"></div>
        
   
   
    <h3>DATA MASTER BARANG</h3>
    <table>
        <thead>
            <tr><th style="width: 40px;">No</th><th>Kode</th><th>Nama Barang</th><th>Pekerja</th><th>Lokasi</th></tr>
        </thead>
        <tbody>
            ${db['tab-barang'].length > 0 ? db['tab-barang'].map((item, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${item.kode || '-'}</td>
                    <td>${item.nama || '-'}</td>
                    <td>${item.pekerja || '-'}</td>
                    <td>${item.lokasi || '-'}</td>
                </tr>
            `).join('') : '<tr><td colspan="5" style="text-align:center; padding: 15px;">Data Master Barang tidak ditemukan</td></tr>'}
        </tbody>
    </table>
    

    <h3>DATA PEMINJAMAN</h3>
    <table>
        <thead>
            <tr><th style="width: 40px;">No</th><th>Tanggal</th><th>Kode</th><th>Nama Barang</th><th>Pekerja</th><th>Lokasi</th></tr>
        </thead>
        <tbody>
            ${filteredPinjam.length > 0 ? filteredPinjam.map((item, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${formatDate(item.tgl)}</td>
                    <td>${item.kode || '-'}</td>
                    <td>${item.nama || '-'}</td>
                    <td>${item.pekerja || '-'}</td>
                    <td>${item.lokasi || '-'}</td>
                </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center; padding: 15px;">Data Peminjaman tidak ditemukan</td></tr>'}
        </tbody>
    </table>
    
    
    <h3>DATA PENGEMBALIAN</h3>
    <table>
        <thead>
            <tr><th style="width: 40px;">No</th><th>Tanggal</th><th>Kode</th><th>Nama Barang</th><th>Pekerja</th><th>Lokasi</th><th>Status</th></tr>
        </thead>
        <tbody>
            ${filteredKembali.length > 0 ? filteredKembali.map((item, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${formatDate(item.tgl)}</td>
                    <td>${item.kode || '-'}</td>
                    <td>${item.nama || '-'}</td>
                    <td>${item.pekerja || '-'}</td>
                    <td>${item.lokasi || '-'}</td>
                    <td>${item.status || '-'}</td>
                </tr>
            `).join('') : '<tr><td colspan="7" style="text-align:center; padding: 15px;">Data Pengembalian tidak ditemukan</td></tr>'}
        </tbody>
    </table>
        </body>
        </html>
    `);

    win.document.close();
    setTimeout(() => {
        win.print();
    }, 500);
}

// 4. RENDER FORM
function renderForm() {
    const formBox = document.getElementById('form-container-box');
    const options = db['tab-barang'].map(b => `<option value="${b.nama}">${b.nama}</option>`).join('');

    if (currentTab === 'tab-barang') {
        formBox.innerHTML = `<h3>Data Barang Baru</h3><input type="date" id="in-tgl"><input type="text" id="in-kode" placeholder="Kode"><input type="text" id="in-nama" placeholder="Nama Barang"><input type="text" id="in-pekerja" placeholder="Pekerja"><input type="text" id="in-lokasi" placeholder="Lokasi/Rak"><button onclick="saveData()">Simpan Data</button>`;
    } else if (currentTab === 'tab-peminjaman') {
        formBox.innerHTML = `<h3>Form Peminjaman</h3><select id="in-nama" onchange="autofillBarangDetail()"><option value="">-- Pilih Barang --</option>${options}</select><input type="date" id="in-tgl"><input type="text" id="in-pekerja" placeholder="Peminjam"><button onclick="saveData()">Simpan Peminjaman</button>`;
    } else {
        formBox.innerHTML = `<h3>Form Pengembalian</h3><select id="in-nama"><option value="">-- Pilih Barang --</option>${options}</select><select id="in-status"><option value="Sudah Dikembalikan">Sudah Dikembalikan</option><option value="Belum Dikembalikan">Belum Dikembalikan</option><option value="Hilang">Hilang</option></select><button onclick="saveData()">Simpan Pengembalian</button>`;
    }
}

function renderTable() {
    const term = document.getElementById('search-input')?.value.toLowerCase() || "";
    const body = document.getElementById('data-table-body');
    const head = document.getElementById('table-header-container');
    
    const data = (db[currentTab] || []).filter(i => 
        i.nama.toLowerCase().includes(term) || (i.kode && i.kode.toLowerCase().includes(term))
    );
    
    const showStatus = currentTab === 'tab-pengembalian';
    
    // Perbaikan Header: Menambahkan kolom 'No'
    head.innerHTML = `
        <tr>
            <th>No</th><th>Tanggal</th><th>Kode</th><th>Nama Barang</th><th>Pekerja</th><th>Lokasi</th>
            ${showStatus ? '<th>Status</th>' : ''}
            <th>Aksi</th>
        </tr>`;
    
    body.innerHTML = data.length > 0 ? data.map((i, idx) => {
        let color = "#333";
        if (i.status === "Sudah Dikembalikan") color = "#27ae60";
        else if (i.status === "Belum Dikembalikan") color = "#f39c12";
        else if (i.status === "Hilang") color = "#c0392b";
        
        // Perbaikan Baris: Menambahkan nomor urut (idx + 1)
        return `
        <tr>
            <td>${idx + 1}</td> 
            <td>${formatDate(i.tgl)}</td> 
            <td>${i.kode || '-'}</td>
            <td>${i.nama || '-'}</td>
            <td>${i.pekerja || '-'}</td>
            <td>${i.lokasi || '-'}</td>
            ${showStatus ? `<td style="color: ${color}; font-weight: bold;">${i.status || '-'}</td>` : ''}
            <td>
                <button class="btn-action" onclick="printPerItem(${idx})">Print</button>
                <button class="btn-action" onclick="editData(${idx})">Edit</button>
                <button class="btn-action" style="color:red;" onclick="deleteData(${idx})">Hapus</button>
            </td>
        </tr>`;
    }).join('') : `<tr><td colspan="${showStatus ? '8' : '7'}" style="text-align:center;">Data tidak ditemukan</td></tr>`;
}
// 6. NAVIGASI
document.querySelectorAll('.nav-link').forEach(btn => {
    btn.onclick = (e) => {
        // 1. Ambil target tab
        currentTab = e.target.getAttribute('data-target');
        document.getElementById('page-title').innerText = e.target.innerText;
        
        // 2. Render ulang data
        renderForm(); 
        renderTable();

        // 3. LOGIKA TAMBAHAN: Menutup sidebar setelah menu dipilih
        const sidebar = document.getElementById('sidebar-menu');
        sidebar.classList.remove('active');
        
        // Opsional: Jika ingin memberi feedback visual bahwa menu sedang aktif/diklik
        document.querySelectorAll('.nav-link').forEach(link => link.style.background = "none");
        e.target.style.background = "#34495e"; // Memberi warna highlight
    };
});

// Tombol Toggle Sidebar
document.getElementById('btn-toggle-form').onclick = () => document.getElementById('form-container-box').classList.toggle('hidden');
window.onload = checkAuth;

const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar-menu');
const closeMenu = document.getElementById('close-menu');

menuToggle.onclick = () => {
    sidebar.classList.add('active');
};

closeMenu.onclick = () => {
    sidebar.classList.remove('active');
};

// Menutup sidebar jika klik area luar
document.addEventListener('click', (event) => {
    if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
        sidebar.classList.remove('active');
    }
});

