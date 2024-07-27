const client = new Paho.MQTT.Client("broker.emqx.io", Number(8083), "clientId-" + Math.random().toString(16).substr(2, 8));

client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

let previousWeight = 0;

client.connect({
    onSuccess: onConnect,
    onFailure: onFailure
});

function onConnect() {
    console.log("Connected to MQTT broker");
    client.subscribe("Rizky/TA/fishFarm/#");
}

function onFailure(responseObject) {
    console.log("Connection failed: " + responseObject.errorMessage);
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Connection lost: " + responseObject.errorMessage);
    }
}

function onMessageArrived(message) {
    console.log("Message arrived: " + message.destinationName + " : " + message.payloadString);
    if (message.destinationName === "Rizky/TA/fishFarm/feedSchedule") {
        document.getElementById("feed-schedule").innerText = message.payloadString;
    } else if (message.destinationName === "Rizky/TA/fishFarm/feedDistribution") {
        document.getElementById("feed-amount").innerText = message.payloadString;
    } else if (message.destinationName === "Rizky/TA/fishFarm/dispenserMonitor") {
        updateFeedCapacityChart(parseFloat(message.payloadString));
    } else if (message.destinationName === "Rizky/TA/fishFarm/alerts") {
        document.getElementById("alerts").innerText = message.payloadString;
    } else if (message.destinationName === "Rizky/TA/fishFarm/fishWeight") {
        const newWeight = parseFloat(message.payloadString);
        document.getElementById("total-fish-weight").innerText = newWeight + " kg";
        updateWeightChange(previousWeight, newWeight);
        previousWeight = newWeight;
    } else if (message.destinationName === "Rizky/TA/fishFarm/deviceStatus") {
        document.getElementById("device-status").innerText = message.payloadString;
    } else if (message.destinationName === "Rizky/TA/fishFarm/harvestPrediction") {
        document.getElementById("harvest-prediction").innerText = message.payloadString;
    }
    updateCurrentTime();
}

function updateFishWeight(isIncrease) {
    const weightInput = parseFloat(document.getElementById("fish-weight-input").value);
    const currentWeight = previousWeight || 0;
    const newWeight = isIncrease ? currentWeight + weightInput : currentWeight - weightInput;

    const message = new Paho.MQTT.Message(newWeight.toString());
    message.destinationName = "Rizky/TA/fishFarm/fishWeight";
    client.send(message);
}

function updateWeightChange(previousWeight, newWeight) {
    const weightChangeElement = document.getElementById("weight-change");
    const difference = newWeight - previousWeight;
    if (difference > 0) {
        weightChangeElement.innerText = `+${difference.toFixed(2)} kg (bertambah)`;
    } else if (difference < 0) {
        weightChangeElement.innerText = `${difference.toFixed(2)} kg (berkurang)`;
    } else {
        weightChangeElement.innerText = `0 kg (tidak berubah)`;
    }
}

function updateCurrentTime() {
    const currentTimeElement = document.getElementById("current-time");
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    currentTimeElement.innerText = formattedTime;
}

let feedCapacityChart;

function createFeedCapacityChart() {
    const ctx = document.getElementById('feed-capacity-chart').getContext('2d');
    feedCapacityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Feed', 'Empty'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#4CAF50', '#F44336'],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateFeedCapacityChart(capacity) {
    feedCapacityChart.data.datasets[0].data = [capacity, 100 - capacity];
    feedCapacityChart.update();
}

document.addEventListener("DOMContentLoaded", function () {
    createFeedCapacityChart();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});
