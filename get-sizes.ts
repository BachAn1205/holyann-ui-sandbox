import sharp from 'sharp'

async function main() {
  const files = [
    'public/email/meeting/Báo lịch meeting.webp',
    'public/email/meeting/Background.png',
    'public/email/meeting/Mascot.png',
  ]
  for (const f of files) {
    const m = await sharp(f).metadata()
    console.log(f.split('/').pop(), '->', m.width, 'x', m.height)
  }
}
main()
