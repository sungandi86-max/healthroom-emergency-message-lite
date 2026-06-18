(function () {
  var currentStep = 1;
  var maxStep = 4;
  var form = document.querySelector("#phraseForm");
  var panels = Array.prototype.slice.call(document.querySelectorAll(".step-panel"));
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".step-tab"));
  var prevBtn = document.querySelector("#prevBtn");
  var nextBtn = document.querySelector("#nextBtn");
  var generateBtn = document.querySelector("#generateBtn");
  var copyBtn = document.querySelector("#copyBtn");
  var resultBox = document.querySelector("#resultBox");
  var outputType = document.querySelector("#outputType");
  var formatBadge = document.querySelector("#formatBadge");
  var toast = document.querySelector("#toast");

  var blockedPatterns = [
    "진단됨",
    "치료함",
    "문제 없음",
    "책임 있음",
    "안전공제 대상임",
    "병원 진료가 필요함",
    "괜찮음",
    "이상 없음",
    "학생 이름",
    "학번",
    "주민등록번호",
    "연락처",
    "질병명",
    "진단명",
    "검사 결과",
    "상담 내용",
    "투약 기록",
    "보호자 연락처",
    "교직원명",
    "개인 연락처"
  ];

  function value(name) {
    var field = form.elements[name];
    return field && field.value ? String(field.value).trim() : "";
  }

  function sanitize(text, fallback) {
    var result = text || fallback || "미입력";
    var replacements = [
      ["진단됨", "확인되었습니다"],
      ["치료함", "보건실 조치 내용을 확인하였습니다"],
      ["문제 없음", "추후 확인이 필요합니다"],
      ["책임 있음", "관련 사항은 학교 내부 절차에 따라 확인이 필요합니다"],
      ["안전공제 대상임", "안전공제 관련 사항은 학교 내부 절차에 따라 확인이 필요합니다"],
      ["병원 진료가 필요함", "병원 진료 여부는 보호자와 상의하여 결정하도록 안내하였습니다"],
      ["괜찮음", "상태를 관찰하였습니다"],
      ["이상 없음", "특이사항은 추후 확인이 필요합니다"]
    ];

    replacements.forEach(function (pair) {
      result = result.split(pair[0]).join(pair[1]);
    });

    return result;
  }

  function line(label, text) {
    return "- " + label + ": " + sanitize(text);
  }

  function contactSentence(label, status) {
    if (status === "안내함" || status === "보고함") return label + " " + status + ".";
    if (status === "119 신고함" || status === "119 인계함") return status + ".";
    if (status === "보호자와 상의 필요") return "병원 진료 여부는 보호자와 상의하여 결정하도록 안내하였습니다.";
    if (status === "해당 없음") return label + " 해당 없음으로 확인하였습니다.";
    return label + " " + status + "입니다.";
  }

  function privacySection() {
    return [
      "개인정보·민감정보 작성 주의",
      "- 학생 이름, 학번, 주민등록번호, 연락처, 질병명, 진단명, 검사 결과, 상담 내용, 투약 기록, 보호자 연락처, 교직원명, 개인 연락처는 입력하지 마세요.",
      "- 이 문구는 연락·보고·안내 초안이며 공식 응급환자 이송 및 사고 기록지를 대체하지 않습니다.",
      "- 실제 기록은 학교 내부 양식과 보건일지에 작성해 주세요."
    ].join("\n");
  }

  function buildAdminMemo() {
    return [
      "관리자 보고용 메모",
      line("상황", value("eventTime") + " " + value("eventPlace") + "에서 " + value("targetType") + "의 " + value("eventType") + " 상황이 확인되었습니다"),
      line("확인된 상황 요약", value("situationSummary")),
      line("보건실에서 확인한 상태", value("checkedStatus")),
      line("보건실 조치 내용", value("actionTaken")),
      line("현재 상태", value("currentStatus")),
      line("연락·인계", [
        contactSentence("담임 안내", value("homeroomNotice")),
        contactSentence("관리자 보고", value("adminReport")),
        contactSentence("보호자 안내", value("guardianNotice")),
        contactSentence("119 관련 사항", value("emergencyNotice"))
      ].join(" ")),
      line("추가 확인 사항", value("followupNote") || "추가 확인이 필요한 경우 보호자 및 관련 담당자와 확인이 필요합니다")
    ].join("\n");
  }

  function buildHomeroomMessage() {
    return [
      "담임 안내 문구",
      value("eventTime") + " " + value("eventPlace") + "에서 " + value("eventType") + " 관련 상황이 확인되었습니다.",
      sanitize(value("situationSummary"), "확인된 상황을 바탕으로 보건실에서 상태를 확인하였습니다."),
      "보건실 확인 내용: " + sanitize(value("checkedStatus")),
      "보건실 조치 내용: " + sanitize(value("actionTaken")),
      "현재 상태는 " + sanitize(value("currentStatus")) + "으로 확인되었습니다.",
      contactSentence("보호자 안내", value("guardianNotice")),
      sanitize(value("followupNote"), "추가 확인이 필요한 경우 보호자 및 관련 담당자와 확인이 필요합니다.")
    ].join("\n");
  }

  function buildGuardianMessage() {
    return [
      "학부모 안내 문구",
      "안녕하세요. 학교 보건실입니다.",
      value("eventTime") + " " + value("eventPlace") + "에서 " + value("eventType") + " 관련 상황이 확인되어 안내드립니다.",
      "보건실에서 확인한 상태는 다음과 같습니다: " + sanitize(value("checkedStatus")),
      "보건실에서는 " + sanitize(value("actionTaken"), "상태를 확인하고 안정하도록 안내하였습니다") + ".",
      "현재 상태는 " + sanitize(value("currentStatus")) + "으로 확인되었습니다.",
      "병원 진료 여부는 보호자와 상의하여 결정하도록 안내하였습니다.",
      "정확한 상태 확인은 보호자와 상의하여 진행해 주세요.",
      sanitize(value("followupNote"), "추가 확인이 필요한 경우 보호자 및 관련 담당자와 확인이 필요합니다.")
    ].join("\n");
  }

  function buildChecklist() {
    return [
      "후속 확인 체크리스트",
      "- [ ] 관리자 보고 내용 확인",
      "- [ ] 담임 안내 여부 확인",
      "- [ ] 보호자 안내 여부 확인",
      "- [ ] 병원 진료 여부는 보호자와 상의하여 결정하도록 안내하였는지 확인",
      "- [ ] 119 신고 또는 인계 여부 확인",
      "- [ ] 학교 내부 양식 및 보건일지 기록 여부 확인",
      "- [ ] 개인정보·민감정보와 진단·치료·책임 판단 표현이 포함되지 않았는지 확인"
    ].join("\n");
  }

  function findWarnings() {
    var fields = form.querySelectorAll("select, textarea");
    var allText = Array.prototype.map.call(fields, function (field) {
      return field.value || "";
    }).join(" ");

    return blockedPatterns.filter(function (pattern) {
      return allText.indexOf(pattern) !== -1;
    });
  }

  function buildResult() {
    var type = value("outputType");
    var chunks = [];

    if (type === "관리자 보고") chunks.push(buildAdminMemo());
    if (type === "담임 안내") chunks.push(buildHomeroomMessage());
    if (type === "학부모 안내") chunks.push(buildGuardianMessage());
    if (type === "전체") {
      chunks.push(buildAdminMemo(), buildHomeroomMessage(), buildGuardianMessage(), buildChecklist());
    }

    chunks.push(privacySection());

    var warnings = findWarnings();
    if (warnings.length) {
      chunks.push("확인 필요\n- 입력 내용에 개인정보·민감정보 또는 피해야 할 표현 가능성이 있는 단어가 포함되어 있습니다: " + warnings.join(", "));
    }

    return chunks.join("\n\n");
  }

  function setStep(step) {
    currentStep = Math.max(1, Math.min(maxStep, step));

    panels.forEach(function (panel) {
      panel.classList.toggle("is-active", Number(panel.dataset.step) === currentStep);
    });

    tabs.forEach(function (tab, index) {
      tab.classList.toggle("is-active", index + 1 === currentStep);
    });

    prevBtn.disabled = currentStep === 1;
    nextBtn.textContent = currentStep === maxStep ? "문구 생성 단계" : "다음 단계로";
    nextBtn.disabled = currentStep === maxStep;
  }

  function updateBadge() {
    formatBadge.textContent = value("outputType") || "관리자 보고";
  }

  function showToast() {
    toast.classList.add("is-visible");
    window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      setStep(Number(tab.dataset.stepJump));
    });
  });

  prevBtn.addEventListener("click", function () {
    setStep(currentStep - 1);
  });

  nextBtn.addEventListener("click", function () {
    setStep(currentStep + 1);
  });

  outputType.addEventListener("change", updateBadge);

  generateBtn.addEventListener("click", function () {
    updateBadge();
    resultBox.value = buildResult();
  });

  copyBtn.addEventListener("click", function () {
    if (!resultBox.value) {
      resultBox.value = buildResult();
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(resultBox.value).then(showToast).catch(function () {
        resultBox.select();
        document.execCommand("copy");
        showToast();
      });
      return;
    }

    resultBox.select();
    document.execCommand("copy");
    showToast();
  });

  form.addEventListener("reset", function () {
    window.setTimeout(function () {
      resultBox.value = "";
      updateBadge();
      setStep(1);
    }, 0);
  });

  updateBadge();
  setStep(1);
})();
