import * as countries from "i18n-iso-countries";
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
countries.registerLocale(require("i18n-iso-countries/langs/de.json"));
countries.registerLocale(require("i18n-iso-countries/langs/fr.json"));

export function humanFileSize(bytes: number, si?: boolean): string {
  var thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }
  var units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + " " + units[u];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const emailVerificationRegex =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

export function isEmailValid(email: string): boolean {
  return RegExp(emailVerificationRegex).test(email);
}

export function isoCountryCodeToFlagEmoji(country: string) {
  return String.fromCodePoint(
    ...[...country.toUpperCase()].map((c) => c.charCodeAt(0) + 0x1f1a5)
  );
}

export function getCountryNameInLanguage(countryCode, languageCode = "fr") {
  return countries.getName(countryCode, languageCode, { select: "official" });
}

function getCountryMapForLanguageCode(langCode = "en") {
  return countries.getNames(langCode, { select: "official" });
}

export function getCountriesList(
  language = "en"
): { code: string; name: string; emoji: string }[] {
  let countryMap = getCountryMapForLanguageCode("de");
  let countryList = Object.keys(countryMap).sort((a, b) => {
    if (countryMap[a] > countryMap[b]) {
      return 1;
    } else if (countryMap[a] < countryMap[b]) {
      return -1;
    } else {
      return 0;
    }
  });

  return countryList.map((code) => {
    return {
      code: code,
      name: countryMap[code],
      emoji: isoCountryCodeToFlagEmoji(code),
    };
  });
}
