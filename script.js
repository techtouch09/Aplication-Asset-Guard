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

function setWaktuSekarang(inputId) {
    const wib = getWIB();
    const tglStr = wib.toISOString().slice(0, 16);
    const input = document.getElementById(inputId);
    if (input) input.value = tglStr;
}

function toggleForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.classList.toggle("hidden");
    form.dataset.editId = "";
    
    const btnSimpan = form.querySelector("button[type='button'].btn-success");
    if (btnSimpan) btnSimpan.textContent = "Simpan";
    
    const inputTgl = "tgl" + formId.replace("form", "");
    setWaktuSekarang(inputTgl);
}

function resetForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.querySelectorAll("input, select").forEach(el => el.value = "");
    form.dataset.editId = "";
    
    const btnSimpan = form.querySelector("button.btn-success");
    if (btnSimpan) btnSimpan.textContent = "Simpan";
    
    form.classList.add("hidden");
}

// ==============================================
// DATA BARANG
// ==============================================
function simpanBarang() {
    const form = document.getElementById("formBarang");
    const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;

    const kode = document.getElementById("kodeBarang").value.trim();
    const pekerja = document.getElementById("pekerjaBarang").value.trim();
    const nama = document.getElementById("namaBarang").value.trim();
    const qty = parseInt(document.getElementById("qtyBarang").value);
    const shift = document.getElementById("shiftBarang").value.trim();
    const tanggal = document.getElementById("tglBarang").value || getWIB().toISOString().slice(0,16);

    if (!kode || !nama || !pekerja || isNaN(qty) || qty <= 0 || !shift) {
        alert("Semua kolom harus diisi dengan benar!");
        return;
    }

    const data = { id: editId || Date.now(), tanggal, kode, pekerja, nama, qty, shift };
    let daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];

    if (editId) {
        const dataLama = daftarBarang.find(b => b.id === editId);
        if (!dataLama) return;

        const totalPinjam = hitungTotalPinjam(editId);
        if (data.qty < totalPinjam) {
            alert(`Stok tidak boleh kurang dari total dipinjam (${totalPinjam})!`);
            return;
        }

        const index = daftarBarang.findIndex(b => b.id === editId);
        daftarBarang[index] = data;
        alert("Data barang berhasil diperbarui!");
    } else {
        daftarBarang.push(data);
        alert("Data barang berhasil ditambahkan!");
    }

    localStorage.setItem("dataBarang", JSON.stringify(daftarBarang));
    resetForm("formBarang");
    tampilkanBarang();
}

function tampilkanBarang() {
    const daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];
    const tbody = document.querySelector("#tabelBarang tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    daftarBarang.forEach((item, i) => {
        const totalPinjam = hitungTotalPinjam(item.id);
        const sisaStok = item.qty - totalPinjam;
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
            <td>${totalPinjam}</td>
            <td>${sisaStok}</td>
            <td>${item.shift}</td>
            <td>
                <button class="btn edit" onclick="bukaEditBarang(${item.id})">Edit</button>
                <button class="btn hapus" onclick="hapusBarang(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
    updatePilihanBarang();
}

function hitungTotalPinjam(barangId) {
    const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    const daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
    
    const totalPinjam = daftarPinjam
        .filter(p => p.barangId === barangId)
        .reduce((sum, p) => sum + p.qty, 0);
    
    const totalKembali = daftarKembali
        .filter(k => {
            const pinjam = daftarPinjam.find(p => p.id === k.pinjamId);
            return pinjam && pinjam.barangId === barangId;
        })
        .reduce((sum, k) => sum + k.qty, 0);

    return totalPinjam - totalKembali;
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
        b.shift.toLowerCase().includes(kata)
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
            <td>
                <button class="btn edit" onclick="bukaEditBarang(${item.id})">Edit</button>
                <button class="btn hapus" onclick="hapusBarang(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
}

// ==============================================
// DATA PEMINJAMAN
// ==============================================
function updatePilihanBarang() {
    const daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];
    const select = document.getElementById("pilihBarang");
    if (!select) return;
    
    select.innerHTML = `<option value="">-- Pilih Barang --</option>`;
    
    daftarBarang.forEach(item => {
        const sisaStok = item.qty - hitungTotalPinjam(item.id);
        if (sisaStok > 0) {
            const opt = document.createElement("option");
            opt.value = item.id;
            opt.textContent = `${item.kode} | ${item.nama} | Sisa Stok: ${sisaStok}`;
            opt.dataset.kode = item.kode;
            opt.dataset.nama = item.nama;
            opt.dataset.pekerja = item.pekerja;
            opt.dataset.shift = item.shift;
            opt.dataset.sisa = sisaStok;
            select.appendChild(opt);
        }
    });
}

function isiDataBarangPinjam() {
    const select = document.getElementById("pilihBarang");
    if (!select) return;
    const pilihan = select.options[select.selectedIndex];

    if (!pilihan.value) {
        document.getElementById("kodePinjam").value = "";
        document.getElementById("namaPinjam").value = "";
        document.getElementById("pekerjaPinjam").value = "";
        document.getElementById("shiftPinjam").value = "";
        document.getElementById("qtyPinjam").value = "";
        document.getElementById("qtyPinjam").max = "";
        return;
    }

    document.getElementById("kodePinjam").value = pilihan.dataset.kode;
    document.getElementById("namaPinjam").value = pilihan.dataset.nama;
    document.getElementById("pekerjaPinjam").value = pilihan.dataset.pekerja;
    document.getElementById("shiftPinjam").value = pilihan.dataset.shift;
    document.getElementById("qtyPinjam").max = pilihan.dataset.sisa;
    document.getElementById("qtyPinjam").placeholder = `Maksimal: ${pilihan.dataset.sisa}`;
}

function simpanPeminjaman() {
    const form = document.getElementById("formPeminjaman");
    const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;

    const barangId = parseInt(document.getElementById("pilihBarang").value);
    const qtyPinjamBaru = parseInt(document.getElementById("qtyPinjam").value);
    const maks = parseInt(document.getElementById("qtyPinjam").max || 0);
    const tanggal = document.getElementById("tglPinjam").value || getWIB().toISOString().slice(0,16);

    if (!barangId) { alert("Pilih barang terlebih dahulu!"); return; }
    if (!qtyPinjamBaru || qtyPinjamBaru < 1) { alert("Jumlah pinjam minimal 1!"); return; }

    let daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];

    if (editId) {
        const dataLama = daftarPinjam.find(p => p.id === editId);
        if (!dataLama) return;

        const selisih = qtyPinjamBaru - dataLama.qty;
        if (selisih > maks) {
            alert(`Stok tidak cukup! Bisa menambah maksimal ${maks} lagi`);
            return;
        }

        const data = {
            id: editId,
            barangId: barangId,
            tanggal: tanggal,
            kode: document.getElementById("kodePinjam").value,
            nama: document.getElementById("namaPinjam").value,
            pekerja: document.getElementById("pekerjaPinjam").value,
            qty: qtyPinjamBaru,
            shift: document.getElementById("shiftPinjam").value
        };

        const index = daftarPinjam.findIndex(p => p.id === editId);
        daftarPinjam[index] = data;
        alert("Data peminjaman berhasil diperbarui!");
    } else {
        if (qtyPinjamBaru > maks) {
            alert(`Stok tidak cukup! Maksimal pinjam: ${maks}`);
            return;
        }

        const data = {
            id: Date.now(),
            barangId: barangId,
            tanggal: tanggal,
            kode: document.getElementById("kodePinjam").value,
            nama: document.getElementById("namaPinjam").value,
            pekerja: document.getElementById("pekerjaPinjam").value,
            qty: qtyPinjamBaru,
            shift: document.getElementById("shiftPinjam").value
        };

        daftarPinjam.push(data);
        alert("Data peminjaman berhasil ditambahkan!");
    }

    localStorage.setItem("dataPeminjaman", JSON.stringify(daftarPinjam));
    resetForm("formPeminjaman");
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
        const status = sudahKembali >= item.qty ? "✅ Selesai" : "🔄 Belum Selesai";

        const baris = document.createElement("tr");
        baris.innerHTML = `
            <td>${i+1}</td>
            <td>${tgl}</td>
            <td>${item.kode}</td>
            <td>${item.nama}</td>
            <td>${item.pekerja}</td>
            <td>${item.qty}</td>
            <td>${sudahKembali}</td>
            <td>${status}</td>
            <td>${item.shift}</td>
            <td>
                ${status === "🔄 Belum Selesai" ? `<button class="btn edit" onclick="bukaEditPinjam(${item.id})">Edit</button>` : ""}
                <button class="btn hapus" onclick="hapusPinjam(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
    updatePilihanPinjam();
}

function hitungSudahKembali(pinjamId) {
    const daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
    return daftarKembali.filter(k => k.pinjamId === pinjamId).reduce((s, k) => s + k.qty, 0);
}

function bukaEditPinjam(id) {
    const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    const data = daftarPinjam.find(p => p.id === id);
    if (!data) return;

    document.getElementById("pilihBarang").value = data.barangId;
    isiDataBarangPinjam();
    document.getElementById("tglPinjam").value = data.tanggal;
    document.getElementById("qtyPinjam").value = data.qty;

    const form = document.getElementById("formPeminjaman");
    form.dataset.editId = id;
    form.querySelector("button.btn-success").textContent = "Perbarui";
    form.classList.remove("hidden");
    form.scrollIntoView({behavior:"smooth"});
}

function hapusPinjam(id) {
    const sudahKembali = hitungSudahKembali(id);
    if (sudahKembali > 0) {
        alert("Tidak bisa dihapus! Sudah ada barang yang dikembalikan.");
        return;
    }
    if (!confirm("Yakin hapus data peminjaman?")) return;

    let daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    daftarPinjam = daftarPinjam.filter(p => p.id !== id);
    localStorage.setItem("dataPeminjaman", JSON.stringify(daftarPinjam));
    tampilkanPeminjaman();
    tampilkanBarang();
}

function cariPeminjaman() {
    const kata = document.getElementById("searchPeminjaman")?.value.toLowerCase().trim() || "";
    const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    const hasil = kata ? daftarPinjam.filter(p => 
        p.nama.toLowerCase().includes(kata) || 
        p.kode.toLowerCase().includes(kata) ||
        p.pekerja.toLowerCase().includes(kata) ||
        p.shift.toLowerCase().includes(kata)
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
            <td>${item.nama}</td>
            <td>${item.pekerja}</td>
            <td>${item.qty}</td>
            <td>${sudahKembali}</td>
            <td>${status}</td>
            <td>${item.shift}</td>
            <td>
                ${status === "🔄 Belum Selesai" ? `<button class="btn edit" onclick="bukaEditPinjam(${item.id})">Edit</button>` : ""}
                <button class="btn hapus" onclick="hapusPinjam(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
}

// ==============================================
// DATA PENGEMBALIAN
// ==============================================
function updatePilihanPinjam() {
    const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
    const daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];
    const select = document.getElementById("pilihPinjam");
    if (!select) return;
    
    select.innerHTML = `<option value="">-- Pilih Data Peminjaman --</option>`;
    
    daftarPinjam.forEach(item => {
        const barang = daftarBarang.find(b => b.id === item.barangId);
        if (!barang) return;

        const sudahKembali = hitungSudahKembali(item.id);
        const sisaBelumKembali = item.qty - sudahKembali;

        if (sisaBelumKembali > 0) {
            const opt = document.createElement("option");
            opt.value = item.id;
            opt.textContent = `${barang.kode} | ${barang.nama} | Pinjam: ${item.qty} | Belum Kembali: ${sisaBelumKembali}`;
            opt.dataset.kode = item.kode;
            opt.dataset.nama = item.nama;
            opt.dataset.pekerja = item.pekerja;
            opt.dataset.shift = item.shift;
            opt.dataset.sisa = sisaBelumKembali;
            opt.dataset.barangId = item.barangId;
            select.appendChild(opt);
        }
    });
}

function isiDataPinjamKembali() {
    const select = document.getElementById("pilihPinjam");
    if (!select) return;
    const pilihan = select.options[select.selectedIndex];

    if (!pilihan.value) {
        document.getElementById("kodeKembali").value = "";
        document.getElementById("namaKembali").value = "";
        document.getElementById("pekerjaKembali").value = "";
        document.getElementById("shiftKembali").value = "";
        document.getElementById("qtyKembali").value = "";
        document.getElementById("qtyKembali").max = "";
        document.getElementById("qtyKembali").placeholder = "";
        return;
    }

    document.getElementById("kodeKembali").value = pilihan.dataset.kode;
    document.getElementById("namaKembali").value = pilihan.dataset.nama;
    document.getElementById("pekerjaKembali").value = pilihan.dataset.pekerja;
    document.getElementById("shiftKembali").value = pilihan.dataset.shift;
    document.getElementById("qtyKembali").max = pilihan.dataset.sisa;
    document.getElementById("qtyKembali").placeholder = `Maksimal: ${pilihan.dataset.sisa}`;
}

function simpanPengembalian() {
    const form = document.getElementById("formPengembalian");
    const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;

    const pinjamId = parseInt(document.getElementById("pilihPinjam").value);
    const qtyKembaliBaru = parseInt(document.getElementById("qtyKembali").value);
    const maks = parseInt(document.getElementById("qtyKembali").max || 0);
    const tanggal = document.getElementById("tglKembali").value || getWIB().toISOString().slice(0,16);

    if (!pinjamId) { alert("Pilih data peminjaman terlebih dahulu!"); return; }
    if (!qtyKembaliBaru || qtyKembaliBaru < 1) { alert("Jumlah pengembalian minimal 1!"); return; }
    if (qtyKembaliBaru > maks) { alert(`Maksimal pengembalian: ${maks}!`); return; }

    let daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];

    if (editId) {
        const data = {
            id: editId,
            pinjamId: pinjamId,
            barangId: parseInt(document.querySelector(`#pilihPinjam option[value="${pinjamId}"]`)?.dataset.barangId || 0),
            tanggal: tanggal,
            kode: document.getElementById("kodeKembali").value,
            nama: document.getElementById("namaKembali").value,
            pekerja: document.getElementById("pekerjaKembali").value,
            qty: qtyKembaliBaru,
            shift: document.getElementById("shiftKembali").value
        };

        const index = daftarKembali.findIndex(k => k.id === editId);
        daftarKembali[index] = data;
        alert("Data pengembalian berhasil diperbarui!");
    } else {
        const data = {
            id: Date.now(),
            pinjamId: pinjamId,
            barangId: parseInt(document.querySelector(`#pilihPinjam option[value="${pinjamId}"]`)?.dataset.barangId || 0),
            tanggal: tanggal,
            kode: document.getElementById("kodeKembali").value,
            nama: document.getElementById("namaKembali").value,
            pekerja: document.getElementById("pekerjaKembali").value,
            qty: qtyKembaliBaru,
            shift: document.getElementById("shiftKembali").value
        };

        daftarKembali.push(data);
        alert("Data pengembalian berhasil ditambahkan!");
    }

    localStorage.setItem("dataPengembalian", JSON.stringify(daftarKembali));
    resetForm("formPengembalian");
    tampilkanPengembalian();
    tampilkanPeminjaman();
    tampilkanBarang();
}

function tampilkanPengembalian() {
    const daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
    const tbody = document.querySelector("#tabelPengembalian tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    daftarKembali.forEach((item, i) => {
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
            <td>${item.nama}</td>
            <td>${item.pekerja}</td>
            <td>${item.qty}</td>
            <td>${item.shift}</td>
            <td>
                <button class="btn edit" onclick="bukaEditKembali(${item.id})">Edit</button>
                <button class="btn hapus" onclick="hapusKembali(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
}

function bukaEditKembali(id) {
    const daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
    const data = daftarKembali.find(k => k.id === id);
    if (!data) return;

    document.getElementById("pilihPinjam").value = data.pinjamId;
    isiDataPinjamKembali();
    document.getElementById("tglKembali").value = data.tanggal;
    document.getElementById("qtyKembali").value = data.qty;

    const form = document.getElementById("formPengembalian");
    form.dataset.editId = id;
    form.querySelector("button.btn-success").textContent = "Perbarui";
    form.classList.remove("hidden");
    form.scrollIntoView({behavior:"smooth"});
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
        k.pekerja.toLowerCase().includes(kata) ||
        k.shift.toLowerCase().includes(kata)
    ) : daftarKembali;
    tampilkanKembaliTabel(hasil);
}

function tampilkanKembaliTabel(data) {
    const tbody = document.querySelector("#tabelPengembalian tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    data.forEach((item, i) => {
        const tgl = new Date(item.tanggal).toLocaleString("id-ID", {timeZone: "Asia/Jakarta"});
        
        const baris = document.createElement("tr");
        baris.innerHTML = `
            <td>${i+1}</td>
            <td>${tgl}</td>
            <td>${item.kode}</td>
            <td>${item.nama}</td>
            <td>${item.pekerja}</td>
            <td>${item.qty}</td>
            <td>${item.shift}</td>
            <td>
                <button class="btn edit" onclick="bukaEditKembali(${item.id})">Edit</button>
                <button class="btn hapus" onclick="hapusKembali(${item.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(baris);
    });
}

// ==============================================
// CETAK LAPORAN
// ==============================================
// ==============================================
// FUNGSI BANTU: Format Tanggal DD/MM/YYYY
// ==============================================
function formatTanggalFile(tanggal) {
    const d = new Date(tanggal);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`; // Pakai tanda hubung agar valid nama file
}

// ==============================================
// CETAK LAPORAN
// ==============================================
function cetakPerItem(jenis) {
    let data, judul, kolom;
    if (jenis === "barang") {
        data = JSON.parse(localStorage.getItem("dataBarang")) || [];
        judul = "LOG BARANG MASUK";
        kolom = ["NO", "TANGGAL", "KODE", "PEKERJA", "NAMA BARANG", "JUMLAH AWAL", "DIPINJAM", "SISA STOK", "SHIFT"];
        data = data.map((b,i) => ({
            no:i+1,
            tanggal: new Date(b.tanggal).toLocaleDateString("id-ID"),
            kode:b.kode, pekerja:b.pekerja, nama:b.nama,
            qty:b.qty, pinjam:hitungTotalPinjam(b.id), sisa:b.qty - hitungTotalPinjam(b.id), shift:b.shift
        }));
    } else if (jenis === "peminjaman") {
        data = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];
        judul = "LOG BARANG KELUAR";
        kolom = ["NO", "TANGGAL", "KODE", "NAMA BARANG", "PEKERJA", "DIPINJAM", "SUDAH KEMBALI", "SHIFT"];
        data = data.map((p,i) => ({
            no:i+1,
            tanggal: new Date(p.tanggal).toLocaleDateString("id-ID"),
            kode:p.kode, nama:p.nama, pekerja:p.pekerja,
            qty:p.qty, kembali:hitungSudahKembali(p.id), shift:p.shift
        }));
    } else {
        data = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
        judul = "LOG BARANG PENGEMBALIAN";
        kolom = ["NO", "TANGGAL", "KODE", "NAMA BARANG", "PEKERJA", "DIKEMBALIKAN", "SHIFT"];
        data = data.map((k,i) => ({
            no:i+1,
            tanggal: new Date(k.tanggal).toLocaleDateString("id-ID"),
            kode:k.kode, nama:k.nama, pekerja:k.pekerja,
            qty:k.qty, shift:k.shift
        }));
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
    doc.text("APLIKASI PENCATATAN BARANG", 105, 15, {align:"center"});
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

    // Nama file dengan format DD-MM-YYYY
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
        doc.setFontSize(11); doc.text("LOG BARANG MASUK", 14, y); y += 6;
        doc.autoTable({
            startY:y,
            head:[["NO","TANGGAL","KODE","PEKERJA","NAMA","JUMLAH","DIPINJAM","SISA STOK","SHIFT"]],
            body:data.barang.map((b,i) => [i+1, new Date(b.tanggal).toLocaleDateString("id-ID"), b.kode, b.pekerja, b.nama, b.qty, hitungTotalPinjam(b.id), b.qty - hitungTotalPinjam(b.id), b.shift]),
            theme:"grid", styles:{fontSize:8}
        });
        y = doc.lastAutoTable.finalY + 10;
    }
    if (data.pinjam.length) {
        doc.setFontSize(11); doc.text("LOG BARANG KELUAR", 14, y); y += 6;
        doc.autoTable({
            startY:y,
            head:[["NO","TANGGAL","KODE","NAMA","PEKERJA","DIPINJAM","SUDAH KEMBALI","SHIFT"]],
            body:data.pinjam.map((p,i) => [i+1, new Date(p.tanggal).toLocaleDateString("id-ID"), p.kode, p.nama, p.pekerja, p.qty, hitungSudahKembali(p.id), p.shift]),
            theme:"grid", styles:{fontSize:8}
        });
        y = doc.lastAutoTable.finalY + 10;
    }
    if (data.kembali.length) {
        doc.setFontSize(11); doc.text("LOG BARANG PENGEMBALIAN", 14, y); y += 6;
        doc.autoTable({
            startY:y,
            head:[["NO","TANGGAL","KODE","NAMA","PEKERJA","DIKEMBALIKAN","SHIFT"]],
            body:data.kembali.map((k,i) => [i+1, new Date(k.tanggal).toLocaleDateString("id-ID"), k.kode, k.nama, k.pekerja, k.qty, k.shift]),
            theme:"grid", styles:{fontSize:8}
        });
    }

    // Nama file laporan periode
    const namaFile = `LAPORAN_${formatTanggalFile(mulai)}_sd_${formatTanggalFile(selesai)}.pdf`;
    doc.save(namaFile);
}

// ==============================================
// FUNGSI BANTU FORMAT TANGGAL
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
    const dd = String(d.getDate());
    const mm = String(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

// ==============================================
// FUNGSI CETAK EXCEL KESELURUHAN SESUAI FORMAT PDF
// ==============================================
function cetakExcel(data, mulai, selesai) {
    if (!window.XLSX) {
        alert("Library SheetJS/XLSX belum dimuat!");
        return;
    }

    const wb = XLSX.utils.book_new();
    const periodeTeks = `Periode: ${formatTanggalTabel(mulai)} s/d ${formatTanggalTabel(selesai)}`;
    const daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];
    const daftarPinjam = JSON.parse(localStorage.getItem("dataPeminjaman")) || [];

    let sheetData = [];

    // JUDUL UTAMA
    sheetData.push(["LAPORAN KESELURUHAN"]);
    sheetData.push([periodeTeks]);
    sheetData.push([]);
    sheetData.push([]);

    // ==============================================
    // BAGIAN 1: LOG BARANG MASUK
    // ==============================================
    sheetData.push(["LOG BARANG MASUK"]);
    sheetData.push([]);
    const headerMasuk = ["NO", "TANGGAL", "KODE", "PEKERJA", "NAMA", "JUMLAH", "DIPINJAM", "SISA STOK", "SHIFT"];
    sheetData.push(headerMasuk);

    if (data.barang.length > 0) {
        data.barang.forEach((item, index) => {
            const totalPinjam = hitungTotalPinjam(item.id);
            const sisaStok = item.qty - totalPinjam;
            sheetData.push([
                index + 1,
                formatTanggalTabel(item.tanggal),
                item.kode,
                item.pekerja,
                item.nama,
                item.qty,
                totalPinjam,
                sisaStok,
                item.shift
            ]);
        });
    } else {
        sheetData.push(["-", "-", "-", "-", "-", "-", "-", "-", "-"]);
    }

    sheetData.push([]);
    sheetData.push([]);

    // ==============================================
    // BAGIAN 2: LOG BARANG KELUAR / PEMINJAMAN
    // ==============================================
    sheetData.push(["LOG BARANG KELUAR"]);
    sheetData.push([]);
    const headerKeluar = ["NO", "TANGGAL", "KODE", "NAMA", "PEKERJA", "DIPINJAM", "SUDAH KEMBALI", "SHIFT"];
    sheetData.push(headerKeluar);

    if (data.pinjam.length > 0) {
        data.pinjam.forEach((item, index) => {
            const sudahKembali = hitungSudahKembali(item.id);
            sheetData.push([
                index + 1,
                formatTanggalTabel(item.tanggal),
                item.kode,
                item.nama,
                item.pekerja,
                item.qty,
                sudahKembali,
                item.shift
            ]);
        });
    } else {
        sheetData.push(["-", "-", "-", "-", "-", "-", "-", "-"]);
    }

    sheetData.push([]);
    sheetData.push([]);

    // ==============================================
    // BAGIAN 3: LOG BARANG PENGEMBALIAN
    // ==============================================
    sheetData.push(["LOG BARANG PENGEMBALIAN"]);
    sheetData.push([]);
    const headerKembali = ["NO", "TANGGAL", "KODE", "NAMA", "PEKERJA", "DIKEMBALIKAN", "SHIFT"];
    sheetData.push(headerKembali);

    if (data.kembali.length > 0) {
        data.kembali.forEach((item, index) => {
            sheetData.push([
                index + 1,
                formatTanggalTabel(item.tanggal),
                item.kode,
                item.nama,
                item.pekerja,
                item.qty,
                item.shift
            ]);
        });
    } else {
        sheetData.push(["-", "-", "-", "-", "-", "-", "-"]);
    }

    // ==============================================
    // PENGATURAN FORMAT EXCEL
    // ==============================================
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Atur lebar kolom agar rapi dan sesuai
    ws['!cols'] = [
        { wch: 4 },   // NO
        { wch: 11 },  // TANGGAL
        { wch: 10 },  // KODE
        { wch: 18 },  // NAMA / PEKERJA
        { wch: 12 },  // PEKERJA / NAMA
        { wch: 11 },  // JUMLAH / DIPINJAM / DIKEMBALIKAN
        { wch: 12 },  // DIPINJAM / SUDAH KEMBALI
        { wch: 10 },  // SISA STOK / SHIFT
        { wch: 8 }    // SHIFT
    ];

    // Simpan file
    XLSX.utils.book_append_sheet(wb, ws, "LAPORAN_KESELURUHAN");
    const namaFile = `LAPORAN_${formatTanggalFile(mulai)}_sd_${formatTanggalFile(selesai)}.xlsx`;
    XLSX.writeFile(wb, namaFile);
}

// ==============================================
// FUNGSI CETAK EXCEL PER ITEM (TETAP TERSEDIA)
// ==============================================
function cetakExcelPerItem(jenis) {
    if (!window.XLSX) {
        alert("Library SheetJS/XLSX belum dimuat!");
        return;
    }

    const wb = XLSX.utils.book_new();
    let judul = "";
    let header = [];
    let data = [];

    if (jenis === "barang") {
        judul = "LOG BARANG MASUK";
        header = ["NO", "TANGGAL", "KODE", "PEKERJA", "NAMA", "JUMLAH", "DIPINJAM", "SISA STOK", "SHIFT"];
        const daftarBarang = JSON.parse(localStorage.getItem("dataBarang")) || [];
        
        data = daftarBarang.map((item, i) => {
            const totalPinjam = hitungTotalPinjam(item.id);
            const sisaStok = item.qty - totalPinjam;
            return [
                i + 1,
                formatTanggalTabel(item.tanggal),
                item.kode,
                item.pekerja,
                item.nama,
                item.qty,
                totalPinjam,
                sisaStok,
                item.shift
            ];
        });

    } else if (jenis === "peminjaman") {
        judul = "LOG BARANG KELUAR";
        header = ["NO", "TANGGAL", "KODE", "NAMA", "PEKERJA", "DIPINJAM", "SUDAH KEMBALI", "SHIFT"];
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
        header = ["NO", "TANGGAL", "KODE", "NAMA", "PEKERJA", "DIKEMBALIKAN", "SHIFT"];
        const daftarKembali = JSON.parse(localStorage.getItem("dataPengembalian")) || [];
        
        data = daftarKembali.map((item, i) => [
            i + 1,
            formatTanggalTabel(item.tanggal),
            item.kode,
            item.nama,
            item.pekerja,
            item.qty,
            item.shift
        ]);
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
        { wch: 12 }, { wch: 11 }, { wch: 12 }, { wch: 8 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, judul);
    const namaFile = `${judul}_${formatTanggalFile(new Date())}.xlsx`;
    XLSX.writeFile(wb, namaFile);
}

// ==============================================
// MUAT SEMUA DATA
// ==============================================
function muatSemuaData() {
    tampilkanBarang();
    tampilkanPeminjaman();
    tampilkanPengembalian();
}