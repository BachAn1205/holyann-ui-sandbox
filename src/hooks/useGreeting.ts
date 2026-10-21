import { useState, useEffect } from 'react';

const getRandomGreeting = (timeBlocks: string[]): string => {
  const randomIndex = Math.floor(Math.random() * timeBlocks.length);
  return timeBlocks[randomIndex];
};

export const useGreeting = (userName?: string) => {
  // Khởi tạo state tĩnh để tránh lỗi Hydration. 
  // Có thể dùng chuỗi rỗng "" hoặc "Chào bạn!"
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    let messageBlocks: string[] = [];
    const name = userName ? userName.trim() : "bạn";

    // 01:30 - 04:59 (90 - 299)
    if (totalMinutes >= 90 && totalMinutes <= 299) {
      messageBlocks = [
        `Cú đêm ơi, nhớ đi ngủ sớm để giữ gìn sức khỏe nhé ${name}! 🌙`,
        `Học tập là hành trình dài, muộn rồi, nghỉ ngơi thôi nào ${name}! 💤`,
        `Khuya lắm rồi đó ${name}! Nhắm mắt lại và để não bộ được thư giãn nhé. 🦉`
      ];
    }
    // 05:00 - 10:59 (300 - 659)
    else if (totalMinutes >= 300 && totalMinutes <= 659) {
      messageBlocks = [
        `Chào buổi sáng, ${name}! Chúc bạn một ngày học tập tràn đầy năng lượng! ☀️`,
        `Sáng tốt lành, ${name}! Bạn đã sẵn sàng chinh phục mục tiêu hôm nay chưa? 🚀`,
        `Một ngày mới lại bắt đầu, chúc ${name} vạn sự hanh thông! 🌻`
      ];
    }
    // 11:00 - 13:29 (660 - 809)
    else if (totalMinutes >= 660 && totalMinutes <= 809) {
      messageBlocks = [
        `Đến giờ nghỉ trưa rồi, ${name} nạp năng lượng để chiều tiếp tục chiến đấu nhé! 🍱`,
        `Ăn trưa ngon miệng nhé ${name}! Đừng quên cho mắt nghỉ ngơi một chút. 🥗`
      ];
    }
    // 13:30 - 17:59 (810 - 1079)
    else if (totalMinutes >= 810 && totalMinutes <= 1079) {
      messageBlocks = [
        `Chào buổi chiều, ${name}! Chúc bạn có những giờ học thật năng suất nhé! ⚡`,
        `Tiếp tục giữ vững phong độ và sự tập trung cho buổi chiều nào ${name}! 📚`,
        `Đừng để cơn buồn ngủ buổi chiều đánh gục, ${name} nhâm nhi chút trà và tiếp tục nào! 🍵`
      ];
    }
    // 18:00 - 01:29 sáng hôm sau (Các khoảng thời gian còn lại)
    else {
      messageBlocks = [
        `Chào buổi tối, ${name}! Ngày hôm nay của bạn thế nào, có gì vui không? 🌆`,
        `Một ngày vất vả rồi, ${name} dành chút thời gian review lại bài vở và thư giãn nhé! 🛋️`,
        `Buổi tối an lành, ${name}! Bạn đã làm rất tốt ngày hôm nay rồi. 🌟`
      ];
    }

    setGreeting(getRandomGreeting(messageBlocks));
  }, [userName]);

  return greeting;
};
