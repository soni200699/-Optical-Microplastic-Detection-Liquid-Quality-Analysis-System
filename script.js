let currentSamples = [];
let storedDatabase = [];
let activeEditingRecordId = null;
let barChartInstance = null;
let pieChartInstance = null;

window.onload = function() {
    let savedData = localStorage.getItem("microplastic_project_db");
    if (savedData) {
        storedDatabase = JSON.parse(savedData);
        refreshDatabaseHistoryTableLogs();
    }
};

function saveToLocalStorage() {
    localStorage.setItem("microplastic_project_db", JSON.stringify(storedDatabase));
}

function useCustomLiquid() {
    let customVal = document.getElementById("customLiquid").value.trim();
    if (customVal !== "") {
        document.getElementById("liquidSelect").selectedIndex = -1;
    }
}

function getActiveLiquidName() {
    let customVal = document.getElementById("customLiquid").value.trim();
    if (customVal !== "") {
        return customVal;
    }
    let selectEl = document.getElementById("liquidSelect");
    if(selectEl.selectedIndex !== -1) {
        return selectEl.options[selectEl.selectedIndex].value;
    }
    return "Unknown Material Source";
}

function resetCurrentLiquidSamples() {
    currentSamples = [];
    activeEditingRecordId = null;
    
    document.getElementById("scatterVal").value = "";
    document.getElementById("transmissionVal").value = "";
    document.getElementById("turbidityVal").value = "";
    
    document.getElementById("addSampleBtn").disabled = false;
    document.getElementById("addSampleBtn").style.opacity = "1";
    document.getElementById("addSampleBtn").innerText = "Analyze Sample Reading";
    
    updateUserInterfaceLogs();
}

function addSampleData() {
    let scatterInput = document.getElementById("scatterVal").value;
    let transmissionInput = document.getElementById("transmissionVal").value;
    let turbidityInput = document.getElementById("turbidityVal").value;

    if(scatterInput === "" || transmissionInput === "" || turbidityInput === "") {
        alert("Please specify value reading configurations for Scatter, Transmission, and Turbidity fields.");
        return;
    }

    let scatter = Number(scatterInput);
    let transmission = Number(transmissionInput);
    let turbidity = Number(turbidityInput);

    if(scatter < 0 || transmission < 0 || turbidity < 0) {
        alert("Physical properties data attributes cannot hold negative values parameters.");
        return;
    }

    let calculatedScore = (scatter * 0.6) + (transmission * 0.3) + (turbidity * 0.1);

    let statusClassification = "";
    let interpretationTip = "";

    if (calculatedScore < 20) {
        statusClassification = "Safe";
        interpretationTip = "Negligible microplastics (< 20 Index). Safe for human tolerance and body metabolism.";
    } else if (calculatedScore >= 20 && calculatedScore <= 50) {
        statusClassification = "Moderate";
        interpretationTip = "Moderate risk (20-50 Index). Exceeds pure baseline; pre-filtration is highly recommended.";
    } else {
        statusClassification = "Danger";
        interpretationTip = "Critical danger (> 50 Index). Toxic particle concentration; unsafe for direct consumer consumption.";
    }

    let sampleRecord = {
        sampleIndex: currentSamples.length + 1,
        liquidName: getActiveLiquidName(),
        scatterValue: scatter,
        transmissionValue: transmission,
        turbidityValue: turbidity,
        finalScore: calculatedScore,
        status: statusClassification,
        tip: interpretationTip
    };

    currentSamples.push(sampleRecord);

    document.getElementById("scatterVal").value = "";
    document.getElementById("transmissionVal").value = "";
    document.getElementById("turbidityVal").value = "";

    updateUserInterfaceLogs();
}

function updateUserInterfaceLogs() {
    let tableBody = document.getElementById("currentTableBody");
    let sampleCounterLabel = document.getElementById("currentSampleNumber");
    
    sampleCounterLabel.innerText = "Sample " + (currentSamples.length + 1);

    if(currentSamples.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="color: #888;">No readings added yet. Fill values in fields above to display data matrix records.</td>
            </tr>
        `;
        document.getElementById("samplesCount").innerText = "0";
        document.getElementById("avgScore").innerText = "0.00";
        document.getElementById("status").innerText = "-";
        document.getElementById("status").className = "";
        
        destroyChartInstances();
        return;
    }

    tableBody.innerHTML = "";
    let aggregatedScoresSum = 0;
    let safeCount = 0;
    let moderateCount = 0;
    let dangerCount = 0;

    currentSamples.forEach(sample => {
        aggregatedScoresSum += sample.finalScore;
        
        if(sample.status === "Safe") {
            safeCount++;
        } else if(sample.status === "Moderate") {
            moderateCount++;
        } else {
            dangerCount++;
        }

        let tr = document.createElement("tr");
        let dynamicCssClass = "";
        if(sample.status === "Safe") dynamicCssClass = "status-safe";
        else if(sample.status === "Moderate") dynamicCssClass = "status-moderate";
        else dynamicCssClass = "status-danger";

        tr.innerHTML = `
            <td>${sample.sampleIndex}</td>
            <td><strong>${sample.liquidName}</strong></td>
            <td>${sample.scatterValue.toFixed(1)}</td>
            <td>${sample.transmissionValue.toFixed(1)}</td>
            <td>${sample.turbidityValue.toFixed(1)}</td>
            <td>${sample.finalScore.toFixed(2)}</td>
            <td class="${dynamicCssClass}">${sample.status}</td>
            <td style="font-size: 0.85rem; text-align: left; color: #555;">${sample.tip}</td>
        `;
        tableBody.appendChild(tr);
    });

    let currentLength = currentSamples.length;
    let finalCalculatedAverageScore = aggregatedScoresSum / currentLength;
    
    document.getElementById("samplesCount").innerText = currentLength;
    document.getElementById("avgScore").innerText = finalCalculatedAverageScore.toFixed(2);
    
    let statusBoxEl = document.getElementById("status");
    let overallStatusOutcome = "";

    if (finalCalculatedAverageScore < 20) {
        overallStatusOutcome = "Safe";
        statusBoxEl.className = "status-safe";
    } else if (finalCalculatedAverageScore >= 20 && finalCalculatedAverageScore <= 50) {
        overallStatusOutcome = "Moderate Warning";
        statusBoxEl.className = "status-moderate";
    } else {
        overallStatusOutcome = "Danger";
        statusBoxEl.className = "status-danger";
    }
    statusBoxEl.innerText = overallStatusOutcome;

    renderAnalyticalCharts(safeCount, moderateCount, dangerCount);
}

function destroyChartInstances() {
    if(barChartInstance) {
        barChartInstance.destroy();
        barChartInstance = null;
    }
    if(pieChartInstance) {
        pieChartInstance.destroy();
        pieChartInstance = null;
    }
}

function renderAnalyticalCharts(safeTicks, moderateTicks, dangerTicks) {
    let barCanvasCtx = document.getElementById("scoreChart").getContext("2d");
    let pieCanvasCtx = document.getElementById("pieChart").getContext("2d");

    let chartLabels = currentSamples.map(s => "Sample " + s.sampleIndex);
    let chartDataScores = currentSamples.map(s => s.finalScore);
    
    let chartColorsBar = currentSamples.map(s => {
        if(s.status === "Safe") return "#198754";
        if(s.status === "Moderate") return "#ffc107";
        return "#dc3545";
    });

    if(barChartInstance) {
        barChartInstance.destroy();
    }
    if(pieChartInstance) {
        pieChartInstance.destroy();
    }

    barChartInstance = new Chart(barCanvasCtx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Contamination Raw Score Value',
                data: chartDataScores,
                backgroundColor: chartColorsBar,
                borderColor: chartColorsBar.map(c => c === "#198754" ? "#146c43" : (c === "#ffc107" ? "#d39e00" : "#b02a37")),
                borderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let idx = context.dataIndex;
                            let sample = currentSamples[idx];
                            return [
                                " Raw Sensor Score: " + sample.finalScore.toFixed(2),
                                " Safety Status: " + sample.status,
                                " Reason/Tip: " + sample.tip
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Raw Score Index' }
                }
            }
        }
    });

    pieChartInstance = new Chart(pieCanvasCtx, {
        type: 'pie',
        data: {
            labels: ['Safe Samples', 'Moderate Samples', 'Danger Samples'],
            datasets: [{
                data: [safeTicks, moderateTicks, dangerTicks],
                backgroundColor: ['#198754', '#ffc107', '#dc3545'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function storeFinalBatchResult() {
    if(currentSamples.length === 0) {
        alert("No readings configured in buffer stack memory. Add tracking readings data variables first.");
        return;
    }

    let scoreSum = 0;
    currentSamples.forEach(s => {
        scoreSum += s.finalScore;
    });
    
    let finalCalculatedAverageScore = scoreSum / currentSamples.length;
    
    let consolidatedFinalStatus = "";
    if (finalCalculatedAverageScore < 20) {
        consolidatedFinalStatus = "Safe";
    } else if (finalCalculatedAverageScore >= 20 && finalCalculatedAverageScore <= 50) {
        consolidatedFinalStatus = "Moderate";
    } else {
        consolidatedFinalStatus = "Danger";
    }
    
    let samplesBackupCopy = JSON.parse(JSON.stringify(currentSamples));

    if(activeEditingRecordId !== null) {
        let indexToUpdate = storedDatabase.findIndex(r => r.uniqueId === activeEditingRecordId);
        if(indexToUpdate !== -1) {
            storedDatabase[indexToUpdate].materialName = getActiveLiquidName();
            storedDatabase[indexToUpdate].samplesSize = currentSamples.length;
            storedDatabase[indexToUpdate].avgScoreValue = finalCalculatedAverageScore.toFixed(2);
            storedDatabase[indexToUpdate].finalStatusVerdict = consolidatedFinalStatus;
            storedDatabase[indexToUpdate].rawSamplesData = samplesBackupCopy;
            
            alert("Analysis record changes updated successfully for material log row items!");
            activeEditingRecordId = null;
            document.getElementById("customLiquid").value = "";
            resetCurrentLiquidSamples();
            saveToLocalStorage();
            refreshDatabaseHistoryTableLogs();
            return;
        }
    }

    let databaseRecordItem = {
        uniqueId: Date.now(),
        timestamp: new Date().toLocaleString(),
        materialName: getActiveLiquidName(),
        samplesSize: currentSamples.length,
        avgScoreValue: finalCalculatedAverageScore.toFixed(2),
        finalStatusVerdict: consolidatedFinalStatus,
        rawSamplesData: samplesBackupCopy
    };

    storedDatabase.push(databaseRecordItem);
    saveToLocalStorage();
    refreshDatabaseHistoryTableLogs();

    alert("Dataset successfully synchronized in project permanent database records archive!");
    
    document.getElementById("customLiquid").value = "";
    resetCurrentLiquidSamples();
}

function refreshDatabaseHistoryTableLogs() {
    let historyBody = document.getElementById("historyTableBody");
    
    if(storedDatabase.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="7" style="color: #888;">No permanent database records committed yet. Fill metrics and save database tracking dataset.</td>
            </tr>
        `;
        return;
    }

    historyBody.innerHTML = "";

    for(let i = storedDatabase.length - 1; i >= 0; i--) {
        let item = storedDatabase[i];
        let row = document.createElement("tr");
        
        let statusClassStyle = "";
        if(item.finalStatusVerdict === "Safe") statusClassStyle = "status-safe";
        else if(item.finalStatusVerdict === "Moderate") statusClassStyle = "status-moderate";
        else statusClassStyle = "status-danger";

        row.innerHTML = `
            <td>${item.timestamp}</td>
            <td><strong>${item.materialName}</strong></td>
            <td>${item.samplesSize} Readings</td>
            <td>${item.avgScoreValue}</td>
            <td class="${statusClassStyle}">${item.finalStatusVerdict}</td>
            <td>
                <button class="load-btn" onclick="editStoredMaterialDataset(${item.uniqueId})">✏️ Edit</button>
                <button class="export-btn" onclick="generateDeviceReportPDF(${item.uniqueId})">📥 Export PDF</button>
                <button class="share-btn" onclick="shareMaterialDataset(${item.uniqueId})">🔗 Share Link</button>
                <button class="delete-btn" onclick="deleteStoredMaterialDataset(${item.uniqueId})">❌ Delete</button>
            </td>
        `;
        historyBody.appendChild(row);
    }
}

function editStoredMaterialDataset(targetId) {
    let matchedRecord = storedDatabase.find(record => record.uniqueId === targetId);
    
    if(!matchedRecord) {
        alert("Requested data record element search algorithm returned null context indicators parameters.");
        return;
    }

    activeEditingRecordId = targetId;
    document.getElementById("customLiquid").value = matchedRecord.materialName;
    currentSamples = JSON.parse(JSON.stringify(matchedRecord.rawSamplesData));

    document.getElementById("addSampleBtn").disabled = false;
    document.getElementById("addSampleBtn").style.opacity = "1";
    document.getElementById("addSampleBtn").innerText = "Save & Update Sample";

    updateUserInterfaceLogs();
    
    alert("Editing mode initialized. Alter fields values parameters or append more readings records securely.");
}

function generateDeviceReportPDF(targetId) {
    let matchedRecord = storedDatabase.find(record => record.uniqueId === targetId);
    
    if(!matchedRecord) {
        alert("Report context pipeline processing failure. Missing trace pointer targets indicators.");
        return;
    }

    document.getElementById("customLiquid").value = matchedRecord.materialName;
    currentSamples = JSON.parse(JSON.stringify(matchedRecord.rawSamplesData));
    updateUserInterfaceLogs();

    setTimeout(() => {
        let originalTitle = document.title;
        document.title = "Microplastic_Report_" + matchedRecord.materialName.replace(/\s+/g, "_");

        window.print();

        document.title = originalTitle;
    }, 450);
}

function shareMaterialDataset(targetId) {
    let matchedRecord = storedDatabase.find(record => record.uniqueId === targetId);
    if(!matchedRecord) {
        alert("Record not found.");
        return;
    }
    
    let shareText = `🔬 *Microplastic Analysis Project Report* 🔬\n\n` +
                    `🔹 *Material Source:* ${matchedRecord.materialName}\n` +
                    `🔹 *Total Samples Logged:* ${matchedRecord.samplesSize}\n` +
                    `🔹 *Average Raw Score Index:* ${matchedRecord.avgScoreValue}\n` +
                    `🔹 *Final Health Safety Verdict:* ${matchedRecord.finalStatusVerdict.toUpperCase()}\n\n` +
                    `📊 _Generated via Optical Microplastic Detection Simulation System Dashboard._`;

    if (navigator.share) {
        navigator.share({
            title: 'Microplastic Detection Project Report',
            text: shareText,
            url: window.location.href
        })
        .then(() => alert("Shared successfully via native share drawer!"))
        .catch((error) => {
            navigator.clipboard.writeText(shareText);
            alert("Share panel closed. Report summary copied to clipboard as backup!");
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            alert("Native system sharing is not supported on this browser context. Summary text automatically copied to your clipboard logs instead!");
        });
    }
}

function deleteStoredMaterialDataset(targetId) {
    if (confirm("Are you sure you want to delete this material report entry from permanent storage?")) {
        storedDatabase = storedDatabase.filter(record => record.uniqueId !== targetId);
        saveToLocalStorage();
        refreshDatabaseHistoryTableLogs();
        alert("Record deleted successfully!");
    }
}