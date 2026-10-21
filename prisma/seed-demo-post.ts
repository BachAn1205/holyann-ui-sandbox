import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaClient, PostStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '';
if (!connectionUrl) {
  console.error('❌ DATABASE_URL or DIRECT_URL required');
  process.exit(1);
}
const pool = new Pool({ connectionString: connectionUrl });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const author = await prisma.users.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!author) {
    console.error('Không tìm thấy user admin nào để làm tác giả. Đang dùng tài khoản mặc định.');
    const newAuthor = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        full_name: 'Admin',
        email: 'admin@holyann.com',
        role: 'ADMIN',
      }
    });

    await createPost(newAuthor.id);
  } else {
    await createPost(author.id);
  }
}

async function createPost(authorId: string) {
  const post = await prisma.marketing_posts.upsert({
    where: { slug: 'hoi-dap-cung-holyann-explore' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      title: 'HỎI ĐÁP CÙNG HOLYANN EXPLORE',
      slug: 'hoi-dap-cung-holyann-explore',
      excerpt: 'Tại sao tôi nên chọn khóa học viết luận tại Holyann Explore thay vì tự học? Viết luận du học không đơn thuần là viết một bài văn, đó là hành trình đi tìm tâm hồn...',
      content: `HỎI ĐÁP CÙNG HOLYANN EXPLORE\n\n🌟 Tại sao tôi nên chọn khóa học viết luận tại Holyann Explore thay vì tự học?\nTrả lời: Viết luận du học không đơn thuần là viết một bài văn, đó là hành trình đi tìm tâm hồn. Tại Holyann Explore, chúng tôi không chỉ dạy bạn cách dùng từ, mà đồng hành cùng bạn để:\n- Khai phá những tầng trải nghiệm mà chính bạn cũng chưa nhận ra.\n- Biến những điều bình thường thành câu chuyện phi thường mang đậm dấu ấn cá nhân.\n- Có người dẫn dắt để bạn không lạc lối giữa “ma trận” thông tin và những tiêu chuẩn tuyển sinh khắt khe.\n\n🌟 “Đặc quyền 1-1” tại Holyann Explore thực sự diễn ra như thế nào?\nTrả lời: Chúng mình tin rằng mỗi học viên là một cá thể duy nhất, vì vậy sự hỗ trợ cá nhân hóa là yếu tố cốt lõi. Bạn sẽ nhận được 06 buổi làm việc riêng biệt (1-1) đầy chất lượng:\n- 03 buổi Tư vấn định hướng & Phát triển hồ sơ: Holyann cùng bạn nhìn lại bức tranh tổng thể, xây dựng chiến lược làm nổi bật điểm mạnh và khắc phục điểm yếu trong hồ sơ năng lực.\n- 03 buổi Sửa luận chuyên sâu: Đây là lúc “mài giũa viên ngọc”. Holyann sẽ cùng bạn soi xét từng dòng, tinh chỉnh cấu trúc sao cho bài viết mạch lạc, sắc sảo và chạm đến cảm xúc người đọc.\n\n🌟 Học viên sẽ nhận được gì sau khi kết thúc khóa học?\nTrả lời: Không chỉ là kiến thức, cái bạn cầm trên tay là những giá trị hữu hình:\n- 01 Bài luận chính hoàn thiện: Sẵn sàng để gửi đi và chinh phục những hội đồng tuyển sinh khó tính nhất.\n- Tư duy viết luận phụ: Nắm vững công thức và cách triển khai các bài luận phụ bổ trợ.\n- Sự tự tin: Bạn hiểu rõ mình là ai, giá trị của mình nằm ở đâu và làm thế nào để trình bày điều đó với thế giới.\n\n🌟 Sự hỗ trợ của Holyann Explore có kết thúc khi hết giờ học?\nTrả lời: Không. Tại Holyann Explore hướng đến xây dựng một cộng đồng đồng hành bền vững:\n- Bạn được lắng nghe những kinh nghiệm thực chiến từ những người đi trước - những người đã trực tiếp nộp hồ sơ và thành công.\nBạn được dẫn dắt sát sao, nhắc nhở và đốc thúc để đảm bảo tiến độ.\n- Bạn luôn có “điểm tựa” là cộng đồng học thuật văn minh để trao đổi và giải tỏa áp lực.\n\n✍️Đừng để những thắc mắc cản trở bước chân bạn. Đăng ký Chương trình Viết luận 2025 - Holyann Explore để được định hướng chiến lược bài luận phù hợp từng hệ thống tuyển sinh.\n👉 Form đăng ký chương trình: https://url-shortener.me/50NB \n👉 Thông tin chi tiết về Holyann Explore: https://url-shortener.me/50G6 \nThời gian tuyển sinh: Từ 24/12/2025 - 15/1/2026\nThời gian dự kiến khai giảng: 18/01/2026`,
      category: 'Hỏi đáp',
      thumbnail_url: 'https://picsum.photos/seed/fbpost/800/600',
      cta_text: 'Đăng ký ngay',
      cta_link: 'https://url-shortener.me/50NB',
      status: PostStatus.PUBLISHED,
      meta_title: 'HỎI ĐÁP CÙNG HOLYANN EXPLORE',
      meta_description: 'Tại sao tôi nên chọn khóa học viết luận tại Holyann Explore thay vì tự học? Sự hỗ trợ "1-1" giúp bạn khai phá trải nghiệm, tạo dấu ấn cá nhân.',
      author_id: authorId,
      placement: 'featured',
    }
  });
  console.log('✅ Seed created successfully:', post.slug);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
