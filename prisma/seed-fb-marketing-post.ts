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

  const authorId = author ? author.id : crypto.randomUUID();
  if (!author) {
    await prisma.users.create({
      data: {
        id: authorId,
        full_name: 'Admin',
        email: 'admin@holyann.com',
        role: 'ADMIN',
      }
    });
  }

  await prisma.marketing_posts.upsert({
    where: { slug: 'bang-xep-hang-khong-giup-ban-chon-dung-truong' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      title: 'BẢNG XẾP HẠNG KHÔNG GIÚP BẠN CHỌN ĐÚNG TRƯỜNG',
      slug: 'bang-xep-hang-khong-giup-ban-chon-dung-truong',
      excerpt: 'Nhiều du học sinh chọn trường chỉ dựa vào QS Ranking mà không biết rằng tiêu chí này không phản ánh hết chất lượng đào tạo, cơ hội việc làm và sự phù hợp với mục tiêu cá nhân.',
      content: `Không ít du học sinh cảm thấy tự ti hay xấu hổ vì trường mình có thứ hạng thấp, cảm giác không đủ “xịn” trong mắt người khác. Vì vậy, khi chọn trường, nhiều bạn thường có thói quen tra QS Ranking và lấy thứ hạng này làm tiêu chí quyết định. Thật ra, QS Ranking được xây dựng chủ yếu dựa trên danh tiếng học thuật, số công trình nghiên cứu, tỷ lệ trích dẫn khoa học, mức độ quốc tế hóa. Các yếu tố này chiếm tới 80% tổng điểm xếp hạng, trong khi khả năng sinh viên có việc làm hoặc mức độ doanh nghiệp đánh giá cao trường chỉ chiếm khoảng 20%.

Điều này có nghĩa là:
- Bạn không thể biết được trường đó có mối quan hệ sâu rộng với doanh nghiệp hay không.
- Bạn cũng không nhìn thấy rõ: tỷ lệ sinh viên có việc làm, làm đúng ngành, hay cụ thể sinh viên ra trường đang làm ở đâu, trong lĩnh vực nào.
- QS không đo lường chi tiết về mạng lưới nhà tuyển dụng, tỷ lệ việc làm đúng chuyên ngành, hay lộ trình nghề nghiệp trung hạn, dài hạn của sinh viên.

Vì thế, để chọn được một ngôi trường và ngành học thực sự xứng đáng “gửi gắm” vài năm thanh xuân, chỉ nhìn vào thứ hạng là chưa đủ. Bạn cần xác định rõ mong muốn và mục tiêu cá nhân trước:
- Bạn muốn học tập, nghiên cứu sâu theo hướng học thuật hay hướng thực hành, nghề nghiệp?
- Bạn ưu tiên chất lượng đào tạo, môi trường sống, chi phí, khả năng việc làm hay cơ hội định cư?

Tips: Những bài test như MBTI hay Holland chính là bí kíp giúp bạn hiểu sâu hơn về chính mình.

Khi đã có đủ dữ liệu về bản thân, bạn mới có thể:
- Xác định hướng học thuật, ngành học, quốc gia phù hợp,
- Lựa chọn môi trường khớp với mục tiêu, cách học, và con người bạn muốn trở thành.

Biết mình, hiểu trường mới là cách để đưa ra một lựa chọn đúng, vì du học là một quyết định quan trọng cần được cân nhắc kỹ, không phải vì FOMO theo số đông.

Holyann Explore - Future By Design

Tham gia ngay buổi tư vấn du học và các chương trình quốc tế miễn phí tại: https://www.facebook.com/messages/t/369357909598440
Cộng đồng Facebook HoEx Kể chuyện Du Học: https://www.facebook.com/groups/1518349292869296
Cộng đồng Zalo Thông tin Du học & Chương trình Quốc tế: https://zalo.me/g/fknwmz764

Link gốc: https://www.facebook.com/share/p/1EPVMbcMVy/`,
      category: 'Tư vấn chọn trường',
      status: PostStatus.PUBLISHED,
      meta_title: 'BẢNG XẾP HẠNG KHÔNG GIÚP BẠN CHỌN ĐÚNG TRƯỜNG',
      meta_description: 'Nhiều du học sinh chọn trường chỉ dựa vào QS Ranking mà không biết rằng tiêu chí này không phản ánh hết chất lượng đào tạo, cơ hội việc làm và sự phù hợp với mục tiêu cá nhân.',
      author_id: authorId,
      placement: 'featured',
    }
  });
  console.log('✅ Đã thêm bài viết Facebook vào marketing_posts');

  // Bài 2
  await prisma.marketing_posts.upsert({
    where: { slug: 'du-hoc-khong-chi-la-chuyen-hoc' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      title: 'DU HỌC KHÔNG CHỈ LÀ CHUYỆN HỌC',
      slug: 'du-hoc-khong-chi-la-chuyen-hoc',
      excerpt: 'Du học không chỉ là chuyện học, mà còn là hành trình trưởng thành, khám phá bản thân và xây dựng tương lai.',
      content: `Du học không chỉ là chuyện học, mà còn là hành trình trưởng thành, khám phá bản thân và xây dựng tương lai.\n\nBạn sẽ học cách tự lập, quản lý thời gian, tài chính, đối mặt với khó khăn và vượt qua nỗi sợ hãi. Bạn sẽ gặp gỡ những người bạn mới, trải nghiệm nền văn hóa mới và mở rộng thế giới quan của mình.\n\nNhưng quan trọng nhất, du học giúp bạn hiểu rõ hơn về chính mình: bạn là ai, bạn muốn gì và bạn sẽ trở thành người như thế nào trong tương lai.\n\nĐừng chỉ chọn trường vì danh tiếng hay thứ hạng. Hãy chọn nơi phù hợp với mục tiêu, sở thích và giá trị của bản thân.\n\nHolyann Explore - Future By Design\n\nTham gia ngay buổi tư vấn du học và các chương trình quốc tế miễn phí tại: https://www.facebook.com/messages/t/369357909598440\nCộng đồng Facebook HoEx Kể chuyện Du Học: https://www.facebook.com/groups/1518349292869296\nCộng đồng Zalo Thông tin Du học & Chương trình Quốc tế: https://zalo.me/g/fknwmz764\n\nLink gốc: https://www.facebook.com/share/p/18XZ9jzypr/`,
      category: 'Tư vấn chọn trường',
      status: PostStatus.PUBLISHED,
      meta_title: 'DU HỌC KHÔNG CHỈ LÀ CHUYỆN HỌC',
      meta_description: 'Du học không chỉ là chuyện học, mà còn là hành trình trưởng thành, khám phá bản thân và xây dựng tương lai.',
      author_id: authorId,
      placement: 'featured',
    }
  });

  // Bài 3
  await prisma.marketing_posts.upsert({
    where: { slug: 'gap-go-ban-than-trong-hanh-trinh-du-hoc' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      title: 'GẶP GỠ BẢN THÂN TRONG HÀNH TRÌNH DU HỌC',
      slug: 'gap-go-ban-than-trong-hanh-trinh-du-hoc',
      excerpt: 'Hành trình du học là cơ hội để bạn gặp gỡ chính mình, vượt qua giới hạn và trưởng thành hơn mỗi ngày.',
      content: `Hành trình du học là cơ hội để bạn gặp gỡ chính mình, vượt qua giới hạn và trưởng thành hơn mỗi ngày.\n\nMỗi thử thách, mỗi lần vấp ngã đều là bài học quý giá giúp bạn mạnh mẽ hơn. Đừng ngại thay đổi, đừng sợ thất bại, vì đó là một phần của quá trình trưởng thành.\n\nHãy tận hưởng từng khoảnh khắc, trân trọng những trải nghiệm và luôn giữ vững mục tiêu của mình.\n\nHolyann Explore - Future By Design\n\nTham gia ngay buổi tư vấn du học và các chương trình quốc tế miễn phí tại: https://www.facebook.com/messages/t/369357909598440\nCộng đồng Facebook HoEx Kể chuyện Du Học: https://www.facebook.com/groups/1518349292869296\nCộng đồng Zalo Thông tin Du học & Chương trình Quốc tế: https://zalo.me/g/fknwmz764\n\nLink gốc: https://www.facebook.com/share/p/1DYvzcRXkH/`,
      category: 'Tư vấn chọn trường',
      status: PostStatus.PUBLISHED,
      meta_title: 'GẶP GỠ BẢN THÂN TRONG HÀNH TRÌNH DU HỌC',
      meta_description: 'Hành trình du học là cơ hội để bạn gặp gỡ chính mình, vượt qua giới hạn và trưởng thành hơn mỗi ngày.',
      author_id: authorId,
      placement: 'featured',
    }
  });

  // Bài 4
  await prisma.marketing_posts.upsert({
    where: { slug: 'du-hoc-la-hanh-trinh-vuot-ra-khoi-vung-an-toan' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      title: 'DU HỌC LÀ HÀNH TRÌNH VƯỢT RA KHỎI VÙNG AN TOÀN',
      slug: 'du-hoc-la-hanh-trinh-vuot-ra-khoi-vung-an-toan',
      excerpt: 'Du học là hành trình vượt ra khỏi vùng an toàn, đối mặt với thử thách và khám phá những điều mới mẻ.',
      content: `Du học là hành trình vượt ra khỏi vùng an toàn, đối mặt với thử thách và khám phá những điều mới mẻ.\n\nBạn sẽ học cách thích nghi, phát triển kỹ năng mềm và xây dựng sự tự tin cho bản thân. Đừng ngại khó khăn, vì mỗi trải nghiệm đều là bước đệm giúp bạn trưởng thành hơn.\n\nHolyann Explore - Future By Design\n\nTham gia ngay buổi tư vấn du học và các chương trình quốc tế miễn phí tại: https://www.facebook.com/messages/t/369357909598440\nCộng đồng Facebook HoEx Kể chuyện Du Học: https://www.facebook.com/groups/1518349292869296\nCộng đồng Zalo Thông tin Du học & Chương trình Quốc tế: https://zalo.me/g/fknwmz764\n\nLink gốc: https://www.facebook.com/share/p/1E5aHh32BG/`,
      category: 'Tư vấn chọn trường',
      status: PostStatus.PUBLISHED,
      meta_title: 'DU HỌC LÀ HÀNH TRÌNH VƯỢT RA KHỎI VÙNG AN TOÀN',
      meta_description: 'Du học là hành trình vượt ra khỏi vùng an toàn, đối mặt với thử thách và khám phá những điều mới mẻ.',
      author_id: authorId,
      placement: 'featured',
    }
  });
  console.log('✅ Đã thêm 4 bài viết Facebook vào marketing_posts');
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
