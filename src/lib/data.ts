// src/lib/data.ts
import { Users, ShieldCheck, Lightbulb, Infinity as InfinityIcon } from 'lucide-react';

export type DocumentType = 'transcript' | 'certificate' | 'letter' | 'essay' | 'other';

export const BRAND_COLORS = {
    primaryGradient: "bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-blue)]",
    textGradient: "bg-clip-text text-transparent bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-blue)]",
    accent: "bg-[var(--accent-alt)]",
};

export const NAV_LINKS = [
    { name: "Giới Thiệu", href: "#gioi-thieu" },
    { name: "Điểm Nổi Bật", href: "#diem-noi-bat" },
    { name: "Thành Tích", href: "#thanh-tich" },
    { name: "Dịch Vụ", href: "#dich-vu" },
    { name: "Trải Nghiệm", href: "#trai-nghiem" },
];

export const CORE_VALUES = [
    {
        icon: Users,
        title: "Nhân - Con Người",
        desc: "Mỗi học viên không chỉ được trang bị kiến thức để đi xa, mà còn được khai mở bản thân để đi sâu, từ đó tìm thấy giá trị, mục tiêu và con đường phù hợp với chính mình. Holyann Explore đặt con người vào trung tâm: tôn trọng sự khác biệt, nuôi dưỡng sự khát vọng và đồng hành để mỗi cá nhân phát triển thành phiên bản sâu sắc và bền vững nhất của mình.",
    },
    {
        icon: ShieldCheck,
        title: "Đức - Trách Nhiệm",
        desc: " Giáo dục chân chính cần gắn liền với giá trị thực chất và sự phát triển bền vững của con người. Holyann Explore giữ vững tinh thần đạo đức trong mọi quyết định và lấy lợi ích lâu dài của học viên làm trung tâm..",
    },
    {
        icon: Lightbulb,
        title: "Tạo - Sáng Tạo",
        desc: "Mỗi học viên là một hành trình riêng biệt cần được tôn trọng và phát triển cá nhân hóa. Holyann Explore khuyến khích tư duy sáng tạo, sự dám thử nghiệm và luôn không ngừng cải tiến các phương pháp học tập để phù hợp với nhu cầu và tiềm năng đặc thù của từng học viên..",
    },
    {
        icon: InfinityIcon,
        title: "Bền - Bền Vững",
        desc: "Holyann Explore hướng tới xây dựng tư duy, kỹ năng, giá trị cá nhân song song với hỗ trợ hồ sơ, đồng thời phát triển cộng đồng kết nối học viên và cựu học viên, tạo nên mạng lưới bền vững hỗ trợ lâu dài.",
    },
];

export const HIGHLIGHTS = [
    {
        title: "Sự sát sao\nĐồng hành từng bước một",
        bullets: [
            "Luôn theo dõi tiến độ của từng học viên bằng kế hoạch cá nhân hóa và nhật ký học tập.",
            "Không để học viên \"đi một mình\" trong bất kỳ bước nào.",
            "Kết nối 3 chiều Học viên - Phụ huynh - Cố vấn để nhắc nhở, kiểm tra, hỗ trợ kịp thời khi có khó khăn."
        ]
    },
    {
        title: "Hỗ trợ toàn diện 360",
        bullets: [
            "Hỗ trợ từ học thuật, kỹ năng, tư duy, hồ sơ đến tâm lý khi du học.",
            "Giải đáp mọi vấn đề từ nhỏ nhất đến quan trọng nhất.",
            "Hỗ trợ trước - trong - sau khi đi du học.",
            "Hỗ trợ phụ huynh nắm bắt thông tin du học và tình hình học viên."
        ]
    },
    {
        title: "Mô hình nhiều Cố vấn\n cho 01 học viên",
        bullets: [
            "Mỗi học viên được hướng dẫn bởi nhiều Cố vấn chuyên môn khác nhau.",
            "Nhận được nhiều góc nhìn và lời khuyên chất lượng.",
            "Tối ưu hóa hành trình một cách toàn diện nhất."
        ]
    },
    {
        title: "Đội ngũ tư vấn năng động, sáng tạo",
        bullets: [
            "Đội ngũ có kinh nghiệm hướng dẫn chuẩn bị hồ sơ nhận được học bổng lớn từ các trường TOP đầu thế giới.",
            "Đề cao tư duy đổi mới, sáng tạo.",
            "Linh hoạt đưa ra giải pháp phù hợp dựa trên thế mạnh của học viên.",
            "Tinh thần nhiệt huyết, sẵn sàng hỗ trợ, \"cháy\" hết mình vì học viên."
        ]
    },
];

export const TESTIMONIALS = [
    {
        name: "Nguyễn Hoàng Phương Thảo",
        school: "Sinh viên Đại học USF, Hoa Kỳ",
        quote: "Hồi bắt đầu apply em hoang mang lắm..... Em muốn tự cố gắng làm mọi thứ. Nhưng lúc hoàn thành xong bản nháp luận chính đầu tiên, em để mọi người xung quanh đọc tham khảo và nhận xét thì mọi người đều đánh giá ý tưởng của bài có hơi bi quan. Em viết bài dựa trên trải nghiệm thật của em nên em cũng lo lắng không biết nên chỉnh sửa sao để giữ được ý tưởng cốt lõi mà bài luận vẫn được cải thiện hơn. Huhu may quá cuối cùng em cũng tìm được Holyann và Cố vấn chính. Lúc được nói chuyện với chị, em cảm thấy chị siêu thân thiện và luôn cố gắng hỗ trợ về mặt tinh thần. Có những hôm chị em meet đến tận 2h sáng để sửa luận 🥺 Chị dẫn em đi từng bước một, từ sửa idea, đến chau chuốt câu từ và cuối cùng là hoàn thiện một bài luận hoàn chỉnh. Và quan trọng là từ bản nháp cho đến bản hoàn thiện, câu chuyện và trải nghiệm của em vẫn được thể hiện một cách chân thật nhất qua bài luận. Cũng nhờ đó mà em đỗ những trường mà em đặt mục tiêu 🥰 Em cảm ơn chị nhiều lắmmm 🥰❤️",
    },
    {
        name: "Hồ Minh Quang",
        school: "Sinh viên Đại học Purdue Fort Wayne, Hoa Kỳ",
        quote: "Sẽ tương đối khó cho em để viết hết những gì mà Holyann đã làm giúp được cho bản thân em. Giai đoạn đầu lúc làm việc với chị, em bị choáng ngợp với khối lượng công việc... Tuy nhiên, rất may mắn là với sự hỗ trợ của Holyann thì em đã có cách sắp xếp công việc khoa học hơn. Hồi đấy mình toàn so sánh hồ sơ của mình với các bạn rồi tặc lưỡi 'Thôi bỏ đi, dành thời gian apply các trường châu Á còn hơn'. Tuy nhiên, sau rất nhiều ngày trò chuyện với chị, mình như được tiếp thêm sức mạnh: 'Không thử thì sao biết liệu mình có là ngoại lệ không?'. Những buổi meeting lúc 2h sáng, những ý tưởng khác nhau cho việc xây dựng hồ sơ từ HĐNK đến bài luận... Chính các chị đã giúp mình vực dậy niềm tin vào bản thân và dám “cháy” hết mình để theo đuổi đam mê. Em xin cảm ơn các chị nhiều ạ ❤️",
    },
    {
        name: "Nguyễn Đức Mạnh",
        school: "Sinh viên Đại học PolyU, HongKong",
        quote: "Biết đến Holyann Explore một cách khá tình cờ... và em thật sự thấy đây là một cơ hội rất tốt để em có thể hoàn thiện được bộ hồ sơ cũng như chỉn chu tất cả các công đoạn để nhận được kết quả tốt nhất. Em muốn gửi một lời cảm ơn chân thành nhất đến chị Cố vấn chính cùng các chị hỗ trợ vì đã theo sát trong quá trình em làm hồ sơ. Cảm ơn chị vì nhiều đêm sửa luận tới gần sáng của chị do lệch múi giờ và luôn take care em rất kỹ càng. Thật sự em đã rất bất ngờ về sự hỗ trợ rất nhiệt tình, định hướng và chuyên nghiệp trong việc hướng dẫn phát triển hồ sơ.",
    },
    {
        name: "Đỗ Ngọc Bảo Anh",
        school: "Sinh viên Đại học Yonsei, Hàn Quốc",
        quote: "Em biết đến Holyann qua mạng xã hội, và sau khi tìm hiểu thêm, em đã quyết định đồng hành cùng Holyann. Holyann Explore không chỉ hỗ trợ em trong quá trình chuẩn bị hồ sơ, mà còn mang lại cho em một cộng đồng bạn bè cùng chí hướng để em được học hỏi kinh nghiệm từ các anh chị đi trước, có định hướng phát triển bản thân rõ ràng hơn, và cảm thấy tự tin hơn khi nộp hồ sơ học bổng...",
    },
    {
        name: "Phạm Ngọc Diễm",
        school: "Sinh viên Đại học VinUni, Việt Nam",
        quote: "Cố vấn Holyann nhiệt tình, tận tâm, chu đáo. Hướng dẫn em chi tiết, từng bước nên em dễ nắm bắt. Bài giảng cũng chất lượng, đi đúng từng phần, đúng trọng tâm và nắm rõ được điểm mạnh, điểm yếu của em. Sau khi làm theo hướng dẫn của chị, em có nhờ cô bên trường đọc thử qua bài thì cô khen luận siêu truyền cảm hứng... Chị hỗ trợ em nhiều nhất trong quá trình viết CV và luận nên em quyết định thêm thông tin của chị vào reference contact information. Tự dưng gặp được Cố vấn siêu tốt như chị... Em không phải gap year rùi, chiến dịch này đại thành công...",
    },
    {
        name: "An Như Phùng",
        school: "Học viên Holyann Explore",
        quote: "Đầu tiên phải nhấn mạnh QUÁ LÀ NHIỆT HUYẾT Ạ 🥰.. và chất lượng trong từng câu hỏi và câu trả lời. Em cũng vô cùng ấn tượng với lối tư duy của chị, từ cách chị đặt vấn đề và đưa ra các giải pháp. Em đã được nghe phân tích rõ ràng mình cần làm gì trong lúc đang rất mông lung. Em cũng cảm thấy được thúc đẩy mạnh mẽ vì chị đã giải thích lý do tại sao em cần tập trung vào những điều thiết thực hơn và không nên dàn trải... Em cảm nhận được chị rất kiên nhẫn với học viên vì dù em có hỏi hơi nhiều nhưng chị đều đáp lại một cách thoải mái và kỹ càng. Nguồn năng lượng tích cực từ chị đã truyền động lực cho em rất nhiều.",
    }
];


export interface Document {
    id: string;
    name: string;
    type: DocumentType;
    uploadDate: string;
    size: string;
    url: string;
}

export interface StudentProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl: string;
    address: string;
    dob: string;

    // Academic Info
    gpa: number;
    gpaScale: number;
    englishLevel: string; // e.g., "IELTS 7.5"
    satScore?: number;

    // Lists
    extracurriculars: Activity[];
    achievements: string[];
    documents: Document[];

    // Target
    targetMajor: string;
    targetCountry: string;
}

export interface Activity {
    id: string;
    title: string;
    role: string;
    year: string;
    description: string;
}
