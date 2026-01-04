export interface SimpleEmailData {
  hostname: string;
  reportUrl: string;
  score: number;
  maturityLevel: string;
  name?: string;
}

function getScoreColor(score: number): string {
  if (score >= 4) return "#22c55e";
  if (score >= 3) return "#eab308";
  if (score >= 2) return "#f97316";
  return "#ef4444";
}

export function generateSimpleReportEmail(data: SimpleEmailData): string {
  const { hostname, reportUrl, score, maturityLevel, name } = data;
  const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi there,';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AEO Assessment Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000; padding: 48px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 16px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center;">
              <p style="margin: 0; color: #fff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                UpClick Labs
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 20px; color: #a3a3a3; font-size: 16px;">
                ${greeting}
              </p>
              <h1 style="margin: 0 0 8px; color: #fff; font-size: 28px; font-weight: 400; line-height: 1.3;">
                Your AEO readiness report for
              </h1>
              <p style="margin: 0 0 32px;">
                <a href="${reportUrl}" style="color: #d4a000; font-size: 28px; font-weight: 600; text-decoration: none;">
                  ${hostname}
                </a>
              </p>

              <!-- CTA Button -->
              <a href="${reportUrl}" style="display: inline-block; background: #d4a000; color: #000; padding: 18px 40px; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                See your full report
              </a>
            </td>
          </tr>

          <!-- Score Preview -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #141414 0%, #0a0a0a 100%); border-top: 1px solid #1f1f1f;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="vertical-align: middle;">
                    <p style="margin: 0 0 4px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Overall Score
                    </p>
                    <p style="margin: 0;">
                      <span style="color: ${getScoreColor(score)}; font-size: 48px; font-weight: 700;">${score.toFixed(1)}</span>
                      <span style="color: #666; font-size: 18px;">/5</span>
                    </p>
                  </td>
                  <td width="50%" style="vertical-align: middle; text-align: right;">
                    <p style="margin: 0 0 4px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Maturity Level
                    </p>
                    <p style="margin: 0; color: #fff; font-size: 24px; font-weight: 600;">
                      ${maturityLevel}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's in the report -->
          <tr>
            <td style="padding: 32px 40px; border-top: 1px solid #1f1f1f;">
              <p style="margin: 0 0 16px; color: #fff; font-size: 14px; font-weight: 600;">
                Your report includes:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <table>
                      <tr>
                        <td width="24" style="color: #22c55e; font-size: 14px;">✓</td>
                        <td style="color: #a3a3a3; font-size: 14px;">Detailed score breakdown by pillar</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <table>
                      <tr>
                        <td width="24" style="color: #22c55e; font-size: 14px;">✓</td>
                        <td style="color: #a3a3a3; font-size: 14px;">What you're doing right</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <table>
                      <tr>
                        <td width="24" style="color: #22c55e; font-size: 14px;">✓</td>
                        <td style="color: #a3a3a3; font-size: 14px;">Personalized next steps</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <table>
                      <tr>
                        <td width="24" style="color: #22c55e; font-size: 14px;">✓</td>
                        <td style="color: #a3a3a3; font-size: 14px;">AEO maturity model explanation</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Second CTA -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="${reportUrl}" style="display: inline-block; background: transparent; color: #d4a000; padding: 14px 32px; text-decoration: none; font-size: 14px; font-weight: 600; border: 1px solid #d4a000; border-radius: 8px;">
                View Full Report →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #1f1f1f; text-align: center;">
              <p style="margin: 0 0 8px; color: #525252; font-size: 13px;">
                UpClick Labs · Answer Engine Optimization Agency
              </p>
              <p style="margin: 0; color: #404040; font-size: 12px;">
                <a href="mailto:hello@upclicklabs.com" style="color: #525252; text-decoration: none;">hello@upclicklabs.com</a>
                <span style="margin: 0 8px;">·</span>
                <a href="https://upclicklabs.com" style="color: #d4a000; text-decoration: none;">upclicklabs.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
