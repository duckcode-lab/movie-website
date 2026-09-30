const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

const movies = [
  {
    id: 1,
    title: 'Attack on Titan: Crimson Bow và Arrow',
    englishTitle: 'Attack on Titan: Crimson Bow and Arrow',
    year: 2014,
    quality: 'FHD',
    rating: '8.9',
    episodes: 'Full / Full',
    genre: 'Shounen, Super Power, Fantasy, Drama, Action',
    studio: 'Wit Studio',
    cast: 'Ackerman Mikasa ,Yeager Eren ,Arlert Armin',
    description: 'Movie Recap từ tập 1-13. ',
    country: "Nhật Bản",
    posterUrl: 'https://cdn.myanimelist.net/images/anime/7/63283.jpg',
    bannerUrl: 'https://image.tmdb.org/t/p/original/uqYRYdr8O0YjvuzLlDwvvSoZtuA.jpg',
    videoUrl: 'https://s2.phim1280.tv/20240103/VfPpCbOm/3000kb/hls/index.m3u8'
  },
  {
    id: 2,
    title: 'Kimetsu no yaiba: Đại Chiến Vô Hạn Thành',
    englishTitle: 'Demon Slayer: Kimetsu no Yaiba – Infinity Castle',
    year: 2025,
    quality: 'FHD',
    rating: 9.8,
    episodes: 'Full / Full',
    genre: 'Action, Fantasy, Supernatural, Shounen',
    studio: 'ufotable',
    cast: 'Kamado Tanjirou, Kibutsuji Muzan, Tomioka Giyuu, Kochou Shinobu',
    description: 'Sát Quỷ Đội chính thức bước vào trận chiến sinh tử cuối cùng tại Vô Hạn Thành - đại bản doanh của Muzan. Các Trụ Cột và Tanjirou phải đối đầu trực tiếp với các Thượng Huyền Quỷ hùng mạnh nhất.',
    country: "Nhật Bản",
    posterUrl: 'https://cdn.myanimelist.net/images/anime/1681/148216.jpg',
    bannerUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGtbSP6kL7nuUGjIbnQHIdLrVcfwDY0pFWKlYCrMfpeg&s=10',
    videoUrl: 'https://v7.kkphimplayer7.com/20260729/a8XUKTef/3500kb/hls/index.m3u8'
  },
  {
    id: 3,
    title: "Huyền Thoại Aang: Tiết Khí Sư Cuối Cùng",
    englishTitle: "Avatar: Aang, The Last Airbender",
    posterUrl: 'https://api.phimmoihd.it.com/api/v1/img?url=https%3A%2F%2Fcdn.phimmoihd.it.com%2Fuploads%2Fimages%2Fhuyen-thoai-aang-tiet-khi-su-cuoi-cung-background-msrjmimb6r8.webp&w=384&q=50',
    videoUrl: 'https://v7.kkphimplayer7.com/20260423/RLnA6Qzp/3500kb/hls/index.m3u8',
    bannerUrl:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbXqqcznKSDqxrQwdcUVefggfd12o3WSWqHhJt_nnXQg&s=10',
    rating: 9.0,
    quality: "FHD",
    year: 2026,
    genre: "Hành Động, Phiêu Lưu, Gia Đình",
    director: "Lauren Montgomery",
    cast: "Eric Nam, Jessica Matten, Román Zaragoza, Dave Bautista, Steven Yeun, Dionne Quan, Geraldine Viswanathan, Dee Bradley Baker",
    country: "Âu Mỹ",
    description: "Avatar Aang, the world's last Airbender, learns of an ancient power that could save his culture from extinction. With the help of his friends, he embarks on a global quest to find it before it falls into the wrong hands and threatens to upend the peace they sacrificed everything to achieve."
  },
  {
    id: 4,
    title: 'Shang-Chi và Huyền Thoại Thập Luân',
    englishTitle: 'Shang-Chi and the Legend of the Ten Rings',
    year: 2021,
    quality: 'FHD',
    rating: 7.5,
    episodes: 'Full / Full',
    genre: 'Hành Động, Viễn Tưởng, Phiêu Lưu',
    studio: 'Marvel Studio',
    country: "Âu Mỹ",
    cast: 'Simu Liu, Awkwafina, Zhang Meng`er, Fala Chen, Florian Munteanu, Benedict Wong, Yuen Wah, Michelle Yeoh ',
    description: 'Phim "Shang-Chi và Huyền Thoại Thập Luân" của Marvel Studios có sự tham gia của Simu Liu  (Lưu Tư Mộ) trong vai Shang-Chi (Thượng Khí), người phải đối mặt với quá khứ ngỡ đã quên khi bị lôi kéo vào mạng lưới của tổ chức bí ẩn Thập Hoàn. Phim còn có sự tham gia của Lương Triều Vỹ trong vai Wenwu (Văn Vũ), Awkwafina trong vai Katy, bạn của Shang-Chi và Dương Tử Quỳnh trong vai Jiang Nan, cùng với Fala Chen (Trần Pháp Lạp), Meng"er Zhang (Trương Mộng Nhi), Florian Munteanu và Ronny Chieng (Tiền Tính Y).',
    posterUrl: 'https://api.phimmoihd.it.com/api/v1/img?url=https%3A%2F%2Fcdn.phimmoihd.it.com%2Fuploads%2Fimages%2Fshang-chi-va-huyen-thoai-thap-luan-msri95jp26e.webp&w=384&q=50',
    bannerUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvN8WIcS1S-4Nt2juQqxUGxCorm6VG-8W6IyfrQ5_z-Bl3Q_U6GolrWW8&s=10',
    videoUrl: 'https://s1.phim1280.tv/20231020/TZvkJegN/3000kb/hls/index.m3u8'
  },
  {
    id: 5,
    title: 'Quỷ Dữ Từ Luyện Ngục',
    englishTitle: 'King Keaw',
    year: 2026,
    quality: 'FHD',
    rating: 5.0,
    episodes: 'Full / Full',
    genre: 'Kinh Dị, Hình Sự, Chính Kịch',
    director: ' เอกชัย ศรีวิชัย ',
    cast: 'อินทิรา เจริญปุระ, นภัทร อินทร์ใจเอื้อ, อภิญญา สกุลเจริญสุข, พิมพ์พรรณ ชลายนคุปต์, Sonthaya Chitmanee, เอกชัย ศรีวิชัย, Phakeeya Phongern, Thanetpiphat Sutthihirandamrong',
    country: "Thái Lan",
    description: 'Kingkaew lấy cảm hứng từ vụ án có thật năm 1978, tại nhà tù Bang Kwang khét tiếng. Một người phụ nữ mắc bệnh tâm thần bị buộc tội bắt cóc và sát hại trẻ em gây chấn động. Dù chứng cứ dồn dập, cô vẫn khẳng định “Tôi vô tội”. Cuối cùng, tòa tuyên án tử hình, Kingkaew chết trong oán hận tột cùng. Sau cái chết, hàng loạt hiện tượng kinh hoàng bắt đầu xảy ra. Oan hồn Kingkaew quay lại, gieo rắc nỗi ám ảnh lên tất cả những người liên quan. Khi nỗi sợ dâng cao, họ buộc phải đối mặt với sự thật đen tối phía sau vụ án… và thứ tà ác vẫn chưa chịu ngủ yên.',
    posterUrl: 'https://api.phimmoihd.it.com/api/v1/img?url=https%3A%2F%2Fcdn.phimmoihd.it.com%2Fuploads%2Fimages%2Fquy-du-tu-luyen-nguc-background-msrjmiob24f.webp&w=384&q=50',
    bannerUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4AZI3KwGCVwRGdSZU86b-84TS50Fdxw6lbruPgWOgXg&s=10',

  },
  {
    id: 6,
    title: 'Vùng Đất Linh Hồn',
    englishTitle: 'Spirited Away (Sen to Chihiro no Kamikakushi)',
    year: 2001,
    quality: 'FHD',
    rating: 9.5,
    episodes: 'Full / Full',
    genre: 'Animation, Adventure, Drama, Supernatural',
    studio: 'Studio Ghibli',
    cast: 'Ogino Chihiro, Haku, Yubaba, No-Face',
    country: "Nhật Bản",
    description: 'Chihiro lạc vào thế giới linh hồn sau khi cha mẹ cô bị biến thành heo. Để giải cứu họ và trở về thế giới loài người, cô phải làm việc tại nhà tắm công cộng của phù thủy Yubaba.',
    posterUrl: 'https://cdn.myanimelist.net/images/anime/6/79597.jpg',
    bannerUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRauE77hIql4sEmW58CBP5TfE-HQfcHHzsEvc3_Y-kOQg&s=10',
  },
  {
    id: 7,
    title: 'Tên Cậu Là Gì?',
    englishTitle: 'Your Name. (Kimi no Na wa.)',
    year: 2016,
    quality: 'FHD',
    rating: 9.4,
    episodes: 'Full / Full',
    genre: ' Tình Cảm, Chính Kịch, Trẻ Em',
    studio: 'CoMix Wave Films',
    cast: 'Thần Mộc Long Chi Giới, Thượng Bạch Thạch Manh Âm, Thành Điền Lăng, Du Mộc Bích, Đảo 﨑 Tín Trường, Thạch Xuyên Giới Nhân, Cốc Hoa Âm, てらそままさき',
    country: "Nhật Bản",
    description: 'Mitsuha - nữ sinh vùng nông thôn và Taki - nam sinh tại Tokyo đột nhiên bị tráo đổi thân xác cho nhau qua những giấc mơ. Cả hai bắt đầu tìm cách kết nối và khám phá ra bí mật đằng sau thảm họa sao băng.',
    posterUrl: 'https://cdn.myanimelist.net/images/manga/1/182270.jpg',
    bannerUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSn71hOeo4EdsyN1Zm7yJaoirFU2uk4TbeVMtQgsCVcrg&s',
    videoUrl:'https://s4.phim1280.tv/20241103/SZBlCqIM/2000kb/hls/index.m3u8',
  },
  {
    id: 8,
    title: 'Bleach: Huyết Chiến Ngàn Năm',
    englishTitle: 'Bleach: Thousand-Year Blood War',
    year: 2022,
    quality: 'FHD',
    country: "Nhật Bản",
    rating: 9.1,
    episodes: 'Full / Full',
    genre: 'Action, Supernatural, Shounen, Fantasy',
    studio: 'Studio Pierrot',
    cast: 'Kurosaki Ichigo, Kuchiki Rukia, Yhwach, Ishida Uryuu',
    description: 'Đế chế Quincy dưới sự dẫn dắt của Yhwach trỗi dậy sau 1.000 năm quy ẩn, tuyên chiến với Thi Hồn Giới (Soul Society). Ichigo và các Tử Thần phải dốc toàn lực cho trận chiến sinh tử này.',
    posterUrl: 'https://cdn.myanimelist.net/images/anime/1908/135431.jpg',
    bannerUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEEad9AH59HK1uoL2RJBlebyK-P3NVK_ksKWWEZ2KBhQ&s=10',
  }
];
app.get('/', (req, res) => {
  res.render('index', { 
    pageTitle: 'Kho Phim lẻ',
    movies: movies 
  });
});

app.get('/watch/:id', (req, res) => {
  const movieId = parseInt(req.params.id);
  const movie = movies.find(m => m.id === movieId);

  if (!movie) {
    return res.status(404).send('Không tìm thấy phim!');
  }

  res.render('watch', {
    pageTitle: `Xem phim ${movie.title} - kho phim lẻ`,
    movie: movie
  });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});