import type { DeviceInfo } from '../types.js';

export function parseUserAgent(uaString: string | undefined): DeviceInfo {
  if (!uaString) {
    return { os: 'Unknown OS', type: 'unknown', browser: 'Unknown Browser' };
  }

  const ua = uaString.toLowerCase();

  let os = 'Unknown OS';
  if (ua.includes('windows phone')) os = 'Windows Phone';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ipad')) os = 'iPadOS';
  else if (ua.includes('iphone') || ua.includes('ipod')) os = 'iOS';
  else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('cros')) os = 'ChromeOS';

  let type: DeviceInfo['type'] = 'desktop';
  if (ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile'))) {
    type = 'tablet';
  } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('ipod') || ua.includes('android')) {
    type = 'mobile';
  }

  let browser = 'Unknown Browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';

  return { os, type, browser };
}
