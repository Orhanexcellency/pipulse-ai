export const dynamic = 'force-dynamic';
export async function GET() {
  return new Response('b85663267be7a76ecafdb64a093122b4f19f89c471749f9757d50035925c9d7c2f70040aaca2152e12b9aa2f1feddd12ae37eb421ae66895fd47e5bbfb9cf96'.trim(), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
