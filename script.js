let currentSamples = [];
let storedDatabase = [];
let activeEditingRecordId = null;
let barChartInstance = null;
let pieChartInstance = null;
let captchaCorrectAnswer = null;

window.onload = function() {
    let sessionEmail = localStorage.getItem("microplastic_user_session");
    let sessionName = localStorage.getItem("microplastic_user_name");
    
    if (sessionEmail && sessionName) {
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("printableReportArea").style.display = "block";
        document.getElementById("displayUserSessionEmail").innerText = sessionEmail;
        document.getElementById("displayUserSessionName").innerText = sessionName;
        document.getElementById("avatarLetterIcon").innerText = sessionName.charAt(0).toUpperCase();
    } else {
        generateMathCaptcha();
    }

    let savedData = localStorage.getItem("microplastic_project_db");
    if (savedData) {
        storedDatabase = JSON.parse(savedData);
        refreshDatabaseHistoryTableLogs();
    }
};

function generateMathCaptcha() {
    let num1 = Math.floor(Math.random() * 12) + 1;
    let num2 = Math.floor(Math.random() * 12) + 1;
    captchaCorrectAnswer = num1 + num2;
    document.getElementById("captchaQuestion").innerText = num1 + " + " + num2 + " = ?";
    document.getElementById("captchaInput").value = "";
}

function handleUserLoginAuthentication() {
    let nameVal = document.getElementById("registerName").value.trim();
    let userVal = document.getElementById("loginUser").value.trim();
    let passVal = document.getElementById("loginPass").value;
    let captchaVal = document.getElementById("captchaInput").value;

    if (nameVal === "" || userVal === "" || passVal === "") {
        alert("Error: Please enter Name, Email and Password fields.");
        return;
    }

    if (Number(captchaVal) !== captchaCorrectAnswer) {
        alert("Error: Wrong captcha answer. Please calculate correctly.");
        generateMathCaptcha();
        return;
    }

    let usersRegistryKey = "microplastic_registered_users";
    let simulatedUserDatabase = [];
    let savedUsers = localStorage.getItem(usersRegistryKey);
    
    if (savedUsers) {
        simulatedUserDatabase = JSON.parse(savedUsers);
    }

    let matchedUserRecord = null;
    for (let i = 0; i < simulatedUserDatabase.length; i++) {
        if (simulatedUserDatabase[i].email === userVal) {
            matchedUserRecord = simulatedUserDatabase[i];
            break;
        }
    }

    if (matchedUserRecord === null) {
        let newProfileRecord = { name: nameVal, email: userVal, password: passVal, phone: "" };
        simulatedUserDatabase.push(newProfileRecord);
        localStorage.setItem(usersRegistryKey, JSON.stringify(simulatedUserDatabase));
        
        localStorage.setItem("microplastic_user_session", userVal);
        localStorage.setItem("microplastic_user_name", nameVal);
        
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("printableReportArea").style.display = "block";
        document.getElementById("displayUserSessionEmail").innerText = userVal;
        document.getElementById("displayUserSessionName").innerText = nameVal;
        document.getElementById("avatarLetterIcon").innerText = nameVal.charAt(0).toUpperCase();
        
        alert("Account Created! Registration successful in local memory container.");
    } else {
        if (matchedUserRecord.password === passVal) {
            localStorage.setItem("microplastic_user_session", userVal);
            localStorage.setItem("microplastic_user_name", matchedUserRecord.name);
            
            document.getElementById("loginPage").style.display = "none";
            document.getElementById("printableReportArea").style.display = "block";
            document.getElementById("displayUserSessionEmail").innerText = userVal;
            document.getElementById("displayUserSessionName").innerText = matchedUserRecord.name;
            document.getElementById("avatarLetterIcon").innerText = matchedUserRecord.name.charAt(0).toUpperCase();
            
            alert("Login Successful! Welcome to Project Dashboard.");
        } else {
            alert("Error: Incorrect password. Please try again.");
            generateMathCaptcha();
        }
    }
}

function handleUserLogoutSession() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("microplastic_user_session");
        localStorage.removeItem("microplastic_user_name");
        document.getElementById("profileDropdownMenu").classList.remove("show-dropdown");
        document.getElementById("printableReportArea").style.display = "none";
        document.getElementById("loginPage").style.display = "flex";
        document.getElementById("registerName").value = "";
        document.getElementById("loginUser").value = "";
        document.getElementById("loginPass").value = "";
        generateMathCaptcha();
    }
}

function toggleUserProfileDropdownMenu() {
    document.getElementById("profileDropdownMenu").classList.toggle("show-dropdown");
}

window.onclick = function(event) {
    if (!event.target.matches('.circular-avatar-trigger') && !event.target.matches('#avatarLetterIcon')) {
        let menuPanel = document.getElementById("profileDropdownMenu");
        if (menuPanel && menuPanel.classList.contains('show-dropdown')) {
            menuPanel.classList.remove('show-dropdown');
        }
    }
};

function triggerSystemModalDialog(contentType) {
    let titleEl = document.getElementById("modalBoxTitle");
    let contentEl = document.getElementById("modalBoxContent");
    document.getElementById("profileDropdownMenu").classList.remove("show-dropdown");

    let activeEmail = localStorage.getItem("microplastic_user_session") || "user@example.com";
    let activeName = localStorage.getItem("microplastic_user_name") || "Operator Name";

    if (contentType === 'profile') {
        let usersRegistryKey = "microplastic_registered_users";
        let db = JSON.parse(localStorage.getItem(usersRegistryKey) || "[]");
        let currentPhone = "";
        for(let i=0; i<db.length; i++) {
            if(db[i].email === activeEmail) {
                currentPhone = db[i].phone || "";
                break;
            }
        }

        titleEl.innerText = "Project Information Dialog";
        contentEl.innerHTML = `<strong>Operator Name:</strong> ${activeName}<br>
                               <strong>Registered Email:</strong> ${activeEmail}<br><br>
                               <label style="display:inline-block; font-weight:600;">Contact Number (Optional):</label><br>
                               <input type="text" id="modalPhoneInput" value="${currentPhone}" placeholder="Enter your contact number" style="width:70%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                               <button type="button" onclick="saveContactNumberOnly()" style="padding:8px 12px; font-size:0.85rem; margin-top:0;">Save Number</button>`;
    } else if (contentType === 'about') {
        titleEl.innerText = "ℹ️ About Our Minor Project Model";
        contentEl.innerHTML = `This project dashboard is designed to simulate a real hardware optical microplastic tracking device.<br><br>
                               When laser light passes through water samples, it gets scattered by plastic waste particles. 
                               The photodiode measures this distortion and calculates a score index to analyze the purity level of different water materials.`;
    } else if (contentType === 'terms') {
        titleEl.innerText = "⚖️ Project Terms & Conditions";
        contentEl.innerHTML = `* This application runs fully on client-side sandboxed local processing loops.<br>
                               * All sample arrays data entries stay completely inside your device browser local cache storage.<br>
                               * Users should check calibration and analog sensor hardware configurations before creating final reports rows.`;
    } else if (contentType === 'help') {
        titleEl.innerText = "❓ Project Troubleshooting Help Desk";
        contentEl.innerHTML = `<strong>Quick Help Guide:</strong><br>
                               * <strong>Charts not loading?</strong> Add sensor values entries inside the input box form first.<br>
                               * <strong>PDF printing cutting borders?</strong> Change your browser print layout target profile destination to 'Save as PDF'.<br>
                               * For hardware pin-outs, please refer to standard Arduino Uno breadboard wire charts.`;
    }
    document.getElementById("infoDialogModal").style.display = "flex";
}

function saveContactNumberOnly() {
    let activeEmail = localStorage.getItem("microplastic_user_session");
    let newPhone = document.getElementById("modalPhoneInput").value.trim();
    let usersRegistryKey = "microplastic_registered_users";
    let db = JSON.parse(localStorage.getItem(usersRegistryKey) || "[]");
    
    for(let i=0; i<db.length; i++) {
        if(db[i].email === activeEmail) {
            db[i].phone = newPhone;
            break;
        }
    }
    localStorage.setItem(usersRegistryKey, JSON.stringify(db));
    alert("Contact number updated successfully inside profile records!");
}

function closeSystemModalDialog() {
    document.getElementById("infoDialogModal").style.display = "none";
}

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
    if (customVal !== "") { return customVal; }
    let selectEl = document.getElementById("liquidSelect");
    if(selectEl && selectEl.selectedIndex !== -1) {
        return selectEl.options[selectEl.selectedIndex].value;
    }
    return "Standard Water Sample";
}

function resetCurrentLiquidSamples() {
    currentSamples = [];
    activeEditingRecordId = null;
    document.getElementById("scatterVal").value = "";
    document.getElementById("transmissionVal").value = "";
    document.getElementById("turbidityVal").value = "";
    let actionBtn = document.getElementById("addSampleBtn");
    if(actionBtn) {
        actionBtn.disabled = false;
        actionBtn.style.opacity = "1";
        actionBtn.innerText = "Add Sample Data";
    }
    updateUserInterfaceLogs();
}

function addSampleData() {
    let scatterInput = document.getElementById("scatterVal").value;
    let transmissionInput = document.getElementById("transmissionVal").value;
    let turbidityInput = document.getElementById("turbidityVal").value;

    if(scatterInput === "" || transmissionInput === "" || turbidityInput === "") {
        alert("Please enter values for Scatter, Transmission, and Turbidity fields before adding data.");
        return;
    }

    let scatter = Number(scatterInput);
    let transmission = Number(transmissionInput);
    let turbidity = Number(turbidityInput);

    if(scatter < 0 || scatter > 500) {
        alert("Error: Scatter reading must be between 0 and 500 lx.");
        return;
    }

    if(transmission < 0 || transmission > 100) {
        alert("Error: Transmission percentage must be between 0 and 100 %.");
        return;
    }

    if(turbidity < 0 || turbidity > 1000) {
        alert("Error: Turbidity reading must be between 0 and 1000 NTU.");
        return;
    }

    let normScatter = (scatter / 5) * 0.6;
    let normTransmission = transmission * 0.3;
    let normTurbidity = (turbidity / 10) * 0.1;
    let calculatedScore = normScatter + normTransmission + normTurbidity;

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

    currentSamples.push({
        sampleIndex: currentSamples.length + 1,
        liquidName: getActiveLiquidName(),
        scatterValue: scatter,
        transmissionValue: transmission,
        turbidityValue: turbidity,
        finalScore: calculatedScore,
        status: statusClassification,
        tip: interpretationTip
    });

    document.getElementById("scatterVal").value = "";
    document.getElementById("transmissionVal").value = "";
    document.getElementById("turbidityVal").value = "";
    updateUserInterfaceLogs();
}

function updateUserInterfaceLogs() {
    let tableBody = document.getElementById("currentTableBody");
    let sampleCounterLabel = document.getElementById("currentSampleNumber");
    if(sampleCounterLabel) { sampleCounterLabel.innerText = "Sample " + (currentSamples.length + 1); }

    if(currentSamples.length === 0) {
        if(tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="empty-state-table-cell">No data recorded yet. Please add readings from the form above.</td></tr>`;
        }
        document.getElementById("samplesCount").innerText = "0";
        document.getElementById("avgScore").innerText = "0.00";
        document.getElementById("status").innerText = "-";
        document.getElementById("status").className = "";
        destroyChartInstances();
        return;
    }

    if(tableBody) { tableBody.innerHTML = ""; }
    let aggregatedScoresSum = 0, safeCount = 0, moderateCount = 0, dangerCount = 0;

    for (let i = 0; i < currentSamples.length; i++) {
        let sample = currentSamples[i];
        aggregatedScoresSum += sample.finalScore;
        if(sample.status === "Safe") safeCount++;
        else if(sample.status === "Moderate") moderateCount++;
        else dangerCount++;

        let tr = document.createElement("tr");
        let cls = sample.status === "Safe" ? "status-safe" : (sample.status === "Moderate" ? "status-moderate" : "status-danger");
        tr.innerHTML = `<td>${sample.sampleIndex}</td>
                        <td><strong>${sample.liquidName}</strong></td>
                        <td>${sample.scatterValue.toFixed(1)} lx</td>
                        <td>${sample.transmissionValue.toFixed(1)} %</td>
                        <td>${sample.turbidityValue.toFixed(1)} NTU</td>
                        <td>${sample.finalScore.toFixed(2)}</td>
                        <td class="${cls}">${sample.status}</td>
                        <td style="font-size: 0.85rem; text-align: left; color: #475569;">${sample.tip}</td>`;
        if(tableBody) { tableBody.appendChild(tr); }
    }

    let finalCalculatedAverageScore = aggregatedScoresSum / currentSamples.length;
    document.getElementById("samplesCount").innerText = currentSamples.length;
    document.getElementById("avgScore").innerText = finalCalculatedAverageScore.toFixed(2);
    
    let statusBoxEl = document.getElementById("status");
    if(statusBoxEl) {
        if (finalCalculatedAverageScore < 20) {
            statusBoxEl.innerText = "Safe Level Parameters"; statusBoxEl.className = "status-safe";
        } else if (finalCalculatedAverageScore >= 20 && finalCalculatedAverageScore <= 50) {
            statusBoxEl.innerText = "Moderate Warning Zone"; statusBoxEl.className = "status-moderate";
        } else {
            statusBoxEl.innerText = "Critical Danger Limit"; statusBoxEl.className = "status-danger";
        }
    }
    renderAnalyticalCharts(safeCount, moderateCount, dangerCount);
}

function destroyChartInstances() {
    if(barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }
    if(pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
}

function renderAnalyticalCharts(safeTicks, moderateTicks, dangerTicks) {
    let barCanvas = document.getElementById("scoreChart");
    let pieCanvas = document.getElementById("pieChart");
    if(!barCanvas || !pieCanvas) return;

    let chartLabels = [], chartDataScores = [];
    let chartColorsBar = [];
    for (let i = 0; i < currentSamples.length; i++) {
        chartLabels.push("Sample " + currentSamples[i].sampleIndex);
        chartDataScores.push(currentSamples[i].finalScore);
        chartColorsBar.push(currentSamples[i].status === "Safe" ? "#16a34a" : (currentSamples[i].status === "Moderate" ? "#eab308" : "#ef4444"));
    }

    if(barChartInstance) barChartInstance.destroy();
    if(pieChartInstance) pieChartInstance.destroy();

    barChartInstance = new Chart(barCanvas.getContext("2d"), {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{ label: 'Sensor Disruption Score Index', data: chartDataScores, backgroundColor: chartColorsBar, borderColor: '#1e293b', borderWidth: 1 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
    });

    pieChartInstance = new Chart(pieCanvas.getContext("2d"), {
        type: 'pie',
        data: {
            labels: ['Clear Layer Samples', 'Cautionary Warning Segments', 'Hazard Deflection Records'],
            datasets: [{ data: [safeTicks, moderateTicks, dangerTicks], backgroundColor: ['#16a34a', '#eab308', '#ef4444'], borderWidth: 1.5, borderColor: '#ffffff' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function storeFinalBatchResult() {
    if(currentSamples.length === 0) {
        alert("Error: Cannot save empty sample records. Please insert readings values first.");
        return;
    }

    let scoreSum = 0;
    for (let i = 0; i < currentSamples.length; i++) { scoreSum += currentSamples[i].finalScore; }
    let finalCalculatedAverageScore = scoreSum / currentSamples.length;
    
    let consolidatedFinalStatus = finalCalculatedAverageScore < 20 ? "Safe" : (finalCalculatedAverageScore <= 50 ? "Moderate" : "Danger");
    let samplesBackupCopy = JSON.parse(JSON.stringify(currentSamples));

    if(activeEditingRecordId !== null) {
        let idx = storedDatabase.findIndex(r => r.uniqueId === activeEditingRecordId);
        if(idx !== -1) {
            storedDatabase[idx].materialName = getActiveLiquidName();
            storedDatabase[idx].samplesSize = currentSamples.length;
            storedDatabase[idx].avgScoreValue = finalCalculatedAverageScore.toFixed(2);
            storedDatabase[idx].finalStatusVerdict = consolidatedFinalStatus;
            storedDatabase[idx].rawSamplesData = samplesBackupCopy;
            alert("Success! Record log entries updated successfully in storage registry table.");
            activeEditingRecordId = null; document.getElementById("customLiquid").value = "";
            resetCurrentLiquidSamples(); saveToLocalStorage(); refreshDatabaseHistoryTableLogs();
            return;
        }
    }

    storedDatabase.push({
        uniqueId: Date.now(),
        timestamp: new Date().toLocaleString(),
        materialName: getActiveLiquidName(),
        samplesSize: currentSamples.length,
        avgScoreValue: finalCalculatedAverageScore.toFixed(2),
        finalStatusVerdict: consolidatedFinalStatus,
        rawSamplesData: samplesBackupCopy
    });
    saveToLocalStorage(); refreshDatabaseHistoryTableLogs();
    alert("Success! Current water source dataset saved permanently to local history table row.");
    document.getElementById("customLiquid").value = "";
    resetCurrentLiquidSamples();
}

function refreshDatabaseHistoryTableLogs() {
    let historyBody = document.getElementById("historyTableBody");
    if(!historyBody) return;
    if(storedDatabase.length === 0) {
        historyBody.innerHTML = `<tr><td colspan="6" class="empty-state-table-cell">No permanent records saved yet. Save active liquids entries to show history log vectors.</td></tr>`;
        return;
    }
    historyBody.innerHTML = "";
    for(let i = storedDatabase.length - 1; i >= 0; i--) {
        let item = storedDatabase[i];
        let row = document.createElement("tr");
        let cls = item.finalStatusVerdict === "Safe" ? "status-safe" : (item.finalStatusVerdict === "Moderate" ? "status-moderate" : "status-danger");
        row.innerHTML = `<td>${item.timestamp}</td>
                        <td><strong>${item.materialName}</strong></td>
                        <td>${item.samplesSize} Item Tracks</td>
                        <td>${item.avgScoreValue}</td>
                        <td class="${cls}">${item.finalStatusVerdict}</td>
                        <td>
                            <button class="load-btn" onclick="editStoredMaterialDataset(${item.uniqueId})">✏️ Edit</button>
                            <button class="export-btn" onclick="generateDeviceReportPDF(${item.uniqueId})">📥 PDF Report</button>
                            <button class="share-btn" onclick="shareMaterialDataset(${item.uniqueId})">🔗 Share Matrix</button>
                            <button class="delete-btn" onclick="deleteStoredMaterialDataset(${item.uniqueId})">❌ Remove</button>
                        </td>`;
        historyBody.appendChild(row);
    }
}

function editStoredMaterialDataset(targetId) {
    let matchedRecord = storedDatabase.find(r => r.uniqueId === targetId);
    if(!matchedRecord) { alert("Error: Target record element index locator trace returned null."); return; }

    activeEditingRecordId = targetId;
    document.getElementById("customLiquid").value = matchedRecord.materialName;
    currentSamples = JSON.parse(JSON.stringify(matchedRecord.rawSamplesData));
    let actionBtn = document.getElementById("addSampleBtn");
    if(actionBtn) {
        actionBtn.disabled = false; actionBtn.style.opacity = "1";
        actionBtn.innerText = "Save Modified Parameters Array Data";
    }
    updateUserInterfaceLogs();
    alert("Editing Mode: Content loaded back onto configuration inputs fields layers.");
}

function generateDeviceReportPDF(targetId) {
    let matchedRecord = storedDatabase.find(r => r.uniqueId === targetId);
    if(!matchedRecord) { alert("Error: Report setup tracking failed due to missing record traces index points."); return; }

    document.getElementById("customLiquid").value = matchedRecord.materialName;
    currentSamples = JSON.parse(JSON.stringify(matchedRecord.rawSamplesData));
    updateUserInterfaceLogs();
    setTimeout(() => {
        let originalTitle = document.title;
        document.title = "Project_Report_" + matchedRecord.materialName.replace(/\s+/g, "_");
        window.print(); document.title = originalTitle;
    }, 500);
}

function shareMaterialDataset(targetId) {
    let matchedRecord = storedDatabase.find(r => r.uniqueId === targetId);
    if(!matchedRecord) { alert("Error: Record extraction failed."); return; }
    
    let shareText = `🔬 Microplastic Analysis Project Report 🔬\n\n` +
                    `🔷 Material Source: ${matchedRecord.materialName}\n` +
                    `🔷 Total Samples Logged: ${matchedRecord.samplesSize}\n` +
                    `🔷 Average Raw Score Index: ${matchedRecord.avgScoreValue}\n` +
                    `🔷 Final Health Safety Verdict: ${matchedRecord.finalStatusVerdict.toUpperCase()}\n\n` +
                    `📊 Generated via Optical Microplastic Detection Simulation System Dashboard.`;

    if (navigator.share) {
        navigator.share({
            title: 'Microplastic Detection Project Report',
            text: shareText,
            url: window.location.href
        })
        .then(() => alert("Shared successfully via native share drawer!"))
        .catch(() => {
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
    if (confirm("Are you sure you want to delete this material record trace permanently from memory cache?")) {
        storedDatabase = storedDatabase.filter(r => r.uniqueId !== targetId);
        saveToLocalStorage(); refreshDatabaseHistoryTableLogs();
        alert("Purge Complete: Row deleted successfully from the project log list.");
    }
}
