const formatter = new Intl.RelativeTimeFormat("pt-BR");

export function formatSeconds(seconds) {
  if (seconds <= 60) {
    return formatter.format(seconds, "seconds");
  }

  if (seconds <= 3600) {
    return formatter.format(Math.floor(seconds / 60), "minutes");
  }

  if (seconds <= 86400) {
    return formatter.format(Math.floor(seconds / 3600), "hours");
  }

  return formatter.format(Math.floor(seconds / 86400), "days");
}
