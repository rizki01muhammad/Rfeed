
// Koneksi ke MQTT broker
client.connect({
    onSuccess: onConnect,
    onFailure: onFailure
});

// Fungsi yang dijalankan saat koneksi berhasil
function onConnect() {
    console.log("Connected to MQTT broker at test.mosquitto.org");
    // Subscribe ke semua topik di dalam "Rizki/TA/fishFarm/#"
    client.subscribe("Rizki/TA/fishFarm/#");
}

// Fungsi yang dijalankan saat koneksi gagal
function onFailure(responseObject) {
    console.log("Connection failed: " + responseObject.errorMessage);
}

// Fungsi yang dijalankan saat koneksi terputus
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Connection lost: " + responseObject.errorMessage);
    }
}

// Fungsi untuk menangani pesan yang diterima dari broker MQTT
function onMessageArrived(message) {
    console.log(`Message arrived [${message.destinationName}]: ${message.payloadString}`);
    const payload = message.payloadString;

    // Update elemen UI berdasarkan topik yang diterima
    switch (message.destinationName) {
        case "Rizki/TA/fishFarm/feedSchedule":
            document.getElementById("feed-schedule").innerText = `${payload} gram`;
            break;
        case "Rizki/TA/fishFarm/feedDistribution":
            document.getElementById("feed-amount").innerText = `${payload} gram`;
            break;
        case "Rizki/TA/fishFarm/dispenserMonitor":
            updateFeedCapacityChart(parseFloat(payload));
            break;
        case "Rizki/TA/fishFarm/alerts":
            document.getElementById("alerts").innerText = payload;
            const alertStatus = payload.toLowerCase() === "sehat" ? "badge-success" : "badge-danger";
            document.getElementById("system-status").className = `badge ${alertStatus}`;
            break;
        case "Rizki/TA/fishFarm/fishWeight":
            updateFishWeightDisplay(parseFloat(payload));
            break;
        case "Rizki/TA/fishFarm/deviceStatus":
            document.getElementById("device-status").innerText = payload;
            break;
        case "Rizki/TA/fishFarm/harvestPrediction":
            document.getElementById("harvest-prediction").innerText = payload;
            break;
        default:
            console.log("Unhandled topic: ", message.destinationName);
    }
    updateCurrentTime();
}

// Fungsi untuk memperbarui berat ikan
function updateFishWeightDisplay(newWeight) {
    const previousWeight = parseFloat(document.getElementById("total-fish-weight").innerText) || 0;
    document.getElementById("total-fish-weight").innerText = `${newWeight} kg`;
    const weightChange = newWeight - previousWeight;
    const weightChangeElement = document.getElementById("weight-change");
    weightChangeElement.innerText = `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(2)} kg (${weightChange > 0 ? "bertambah" : "berkurang"})`;
}

// Fungsi untuk memperbarui waktu saat ini di UI
function updateCurrentTime() {
    const currentTimeElement = document.getElementById("datetime");
    const now = new Date();
    const formattedTime = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    currentTimeElement.innerText = formattedTime;
}

// Inisialisasi chart untuk memantau kapasitas dispenser pakan
let feedCapacityChart;
function createFeedCapacityChart() {
    const ctx = document.getElementById("feed-capacity-chart").getContext("2d");
    feedCapacityChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Feed", "Empty"],
            datasets: [{
                data: [0, 100],
                backgroundColor: ["#4CAF50", "#F44336"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Fungsi untuk memperbarui data chart kapasitas dispenser
function updateFeedCapacityChart(capacity) {
    feedCapacityChart.data.datasets[0].data = [capacity, 100 - capacity];
    feedCapacityChart.update();
}

// Inisialisasi setelah DOM selesai dimuat
document.addEventListener("DOMContentLoaded", function () {
    createFeedCapacityChart();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000); // Perbarui waktu setiap detik
});
// Konfigurasi koneksi ke broker MQTT test.mosquitto.org
const client = new Paho.MQTT.Client("test.mosquitto.org", Number(1883), "clientId-" + Math.random().toString(16).substr(2, 8));

// Event handler untuk koneksi MQTT
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;
