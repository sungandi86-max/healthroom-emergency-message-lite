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

  var fallbackText = {
    eventTime: "발생 시점은 학교 내부 기록을 확인해 주세요.",
    eventPlace: "발생 장소는 학교 내부 기록을 확인해 주세요.",
    situationSummary: "구체적인 상황 요약은 학교 내부 기록을 확인해 주세요.",
    checkedStatus: "보건실 확인 내용은 내부 기록에 따라 확인이 필요합니다.",
    actionTaken: "보건실 조치 내용은 내부 기록에 따라 확인이 필요합니다.",
    followupNote: "추가 확인이 필요한 사항은 보호자 및 관련 담당자와 확인해 주세요."
  };

  function value(name) {
    var field = form.elements[name];
    return field && field.value ? String(field.value).trim() : "";
  }

  function fieldText(name) {
    return sanitize(value(name), fallbackText[name] || "");
  }

  function sanitize(text, fallback) {
    var result = text || fallback || "";
    var replacements = [
      [String.fromCharCode(48120, 51077, 47141), ""],
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

    return result.trim();
  }

  function contextSentence() {
    var eventTime = fieldText("eventTime");
    var eventPlace = fieldText("eventPlace");
    var targetType = sanitize(value("targetType"), "대상자");
    var eventType = sanitize(value("eventType"), "응급상황");

    if (eventTime.indexOf("확인해 주세요") !== -1 || eventPlace.indexOf("확인해 주세요") !== -1) {
      return eventTime + " " + eventPlace + " " + targetType + "의 " + eventType + " 관련 상황이 확인되었습니다.";
    }

    return eventTime + " " + eventPlace + "에서 " + targetType + "의 " + eventType + " 상황이 확인되었습니다.";
  }

  function currentStatusSentence() {
    return "현재 상태는 다음과 같이 정리되었습니다: " + sanitize(value("currentStatus"), "추가 확인 필요") + ".";
  }

  function contactSentence(kind, status) {
    var map = {
      homeroom: {
        "안내함": "담임에게 상황을 안내하였습니다.",
        "안내 예정": "담임에게 상황을 안내할 예정입니다.",
        "해당 없음": "담임 안내는 해당 없음으로 확인되었습니다.",
        "확인 필요": "담임 안내 여부는 확인이 필요합니다."
      },
      admin: {
        "보고함": "관리자에게 상황을 보고하였습니다.",
        "보고 예정": "관리자에게 상황을 보고할 예정입니다.",
        "해당 없음": "관리자 보고는 해당 없음으로 확인되었습니다.",
        "확인 필요": "관리자 보고 여부는 확인이 필요합니다."
      },
      guardian: {
        "안내함": "보호자에게 상황을 안내하였습니다.",
        "안내 예정": "보호자에게 상황을 안내할 예정입니다.",
        "해당 없음": "보호자 안내는 해당 없음으로 확인되었습니다.",
        "확인 필요": "보호자 안내 여부는 확인이 필요합니다."
      },
      clinic: {
        "안내함": "병원 진료 여부는 보호자와 상의하여 결정하도록 안내하였습니다.",
        "보호자와 상의 필요": "병원 진료 여부는 보호자와 상의가 필요합니다.",
        "해당 없음": "병원 진료 안내는 해당 없음으로 확인되었습니다.",
        "확인 필요": "병원 진료 안내 여부는 확인이 필요합니다."
      },
      emergency: {
        "119 신고함": "119 신고를 진행하였습니다.",
        "119 인계함": "119 대원에게 상황을 인계하였습니다.",
        "해당 없음": "119 신고 또는 인계는 해당 없음으로 확인되었습니다.",
        "확인 필요": "119 신고 또는 인계 여부는 확인이 필요합니다."
      }
    };

    return map[kind][status] || "해당 사항은 추가 확인이 필요합니다.";
  }

  function privacySection() {
    return [
      "개인정보·민감정보 작성 주의",
      "학생 이름, 학번, 주민등록번호, 연락처, 질병명, 진단명, 검사 결과, 상담 내용, 투약 기록, 보호자 연락처, 교직원명, 개인 연락처는 입력하지 마세요.",
      "이 문구는 연락·보고·안내 초안이며, 공식 응급환자 이송 및 사고 기록지를 대체하지 않습니다. 실제 기록은 학교 내부 양식과 보건일지에 작성해 주세요."
    ].join("\n");
  }

  function buildContactLines() {
    return [
      "- " + contactSentence("homeroom", value("homeroomNotice")),
      "- " + contactSentence("admin", value("adminReport")),
      "- " + contactSentence("guardian", value("guardianNotice")),
      "- " + contactSentence("clinic", value("clinicNotice")),
      "- " + contactSentence("emergency", value("emergencyNotice"))
    ];
  }

  function buildAdminMemo() {
    return [
      "관리자 보고용 메모",
      "",
      contextSentence(),
      "보건실에서 상태를 확인하였으며, " + currentStatusSentence(),
      "",
      "[확인 내용]",
      "- 확인된 상황 요약: " + fieldText("situationSummary"),
      "- 보건실 확인 상태: " + fieldText("checkedStatus"),
      "- 보건실 조치 내용: " + fieldText("actionTaken"),
      "",
      "[연락·인계]",
      buildContactLines().join("\n"),
      "",
      "[후속 확인]",
      fieldText("followupNote")
    ].join("\n");
  }

  function buildHomeroomMessage() {
    return [
      "담임 안내 문구",
      "",
      "선생님, " + contextSentence().replace(" 확인되었습니다.", " 확인되어 보건실에서 상태를 확인하였습니다."),
      currentStatusSentence(),
      contactSentence("guardian", value("guardianNotice")),
      fieldText("followupNote"),
      "개인 건강정보가 포함될 수 있어 자세한 내용은 보건실 내부 기록을 확인해 주세요."
    ].join("\n");
  }

  function buildGuardianMessage() {
    return [
      "학부모 안내 문구",
      "",
      "안녕하세요. 학교 보건실입니다.",
      "금일 학교에서 " + sanitize(value("targetType"), "대상자") + "이 " + sanitize(value("eventType"), "응급상황") + " 관련 상황으로 보건실에서 상태를 확인하였습니다.",
      currentStatusSentence(),
      "현재 상태와 이후 조치에 대해 보호자님과 상의가 필요한 경우 연락드리고자 합니다.",
      contactSentence("clinic", value("clinicNotice")),
      "정확한 상태 확인과 이후 관리는 보호자님과 상의하여 진행해 주세요."
    ].join("\n");
  }

  function buildChecklist() {
    return [
      "후속 확인 체크리스트",
      "- [ ] 보건일지 또는 학교 내부 기록 작성 확인",
      "- [ ] 담임 안내 여부 확인",
      "- [ ] 관리자 보고 여부 확인",
      "- [ ] 보호자 안내 여부 확인",
      "- [ ] 추가 상태 확인 필요 여부 확인",
      "- [ ] 개인정보·민감정보가 문구에 포함되지 않았는지 확인"
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
