import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Hls from 'hls.js';
import { getComments, getGenres, updateMovie } from '../api/api';
import SiteLayout from '../layout/SiteLayout.jsx';

function Watch() {
  const { id } = useParams();
  const [movieData, setMovieData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States dành cho Trình phát video Custom
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);

  // States dành cho Bình luận
  const [commentsState, setCommentsState] = useState({
    movieId: null,
    comments: [],
    loading: true,
    error: '',
  });
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [genres, setGenres] = useState([]);
  const [genreSelection, setGenreSelection] = useState(null);
  const [genreSaving, setGenreSaving] = useState(false);
  const [genreError, setGenreError] = useState('');
  const [genreMessage, setGenreMessage] = useState('');

  // Lấy thông tin user an toàn
  const [user] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isAuthenticated = Boolean(user && localStorage.getItem('accessToken'));
  const movieGenreIds = (movieData?.movie?.genres || []).map((genre) => Number(genre.id));
  const selectedGenreIds = genreSelection?.movieId === id
    ? genreSelection.ids
    : movieGenreIds;

  // Tải chi tiết phim theo ID
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const fetchMovieDetail = async () => {
      try {
        const res = await axios.get(`/api/movies/${id}`);
        if (isMounted) {
          if (res.data.success) {
            setMovieData(res.data.data);
            setError(null);
          } else {
            setError('Không thể tải thông tin phim');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Lỗi khi tải chi tiết phim:', err);
          setError('Không tìm thấy phim hoặc server có lỗi');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMovieDetail();
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (!id) return undefined;
    let isMounted = true;

    getComments(id)
      .then((res) => {
        const result = res.data?.data;
        if (!Array.isArray(result)) {
          throw new Error('Dữ liệu bình luận không hợp lệ.');
        }
        if (isMounted) {
          setCommentsState({ movieId: id, comments: result, loading: false, error: '' });
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải bình luận:', err);
        if (isMounted) {
          setCommentsState({
            movieId: id,
            comments: [],
            loading: false,
            error: err.response?.data?.message || err.message || 'Không thể tải bình luận.',
          });
        }
      });

    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;
    getGenres()
      .then((res) => {
        const result = res.data?.data?.genres;
        if (!Array.isArray(result)) {
          throw new Error('Dữ liệu danh sách thể loại không hợp lệ.');
        }
        if (isMounted) setGenres(result);
      })
      .catch((err) => {
        if (isMounted) {
          setGenreError(err.response?.data?.message || err.message || 'Không thể tải thể loại.');
        }
      });

    return () => { isMounted = false; };
  }, [isAdmin]);

  const handleGenreSubmit = async (e) => {
    e.preventDefault();
    setGenreSaving(true);
    setGenreError('');
    setGenreMessage('');

    try {
      const res = await updateMovie(id, { genreIds: selectedGenreIds });
      const updatedMovie = res.data?.data?.movie;
      if (!updatedMovie) {
        throw new Error('Không thể cập nhật thể loại cho phim.');
      }
      setMovieData((current) => ({ ...current, movie: updatedMovie }));
      setGenreSelection(null);
      setGenreMessage('Đã cập nhật thể loại cho phim.');
    } catch (err) {
      setGenreError(err.response?.data?.message || err.message || 'Không thể cập nhật thể loại.');
    } finally {
      setGenreSaving(false);
    }
  };

  // Khởi tạo HLS Player
  useEffect(() => {
    const video = videoRef.current;
    const videoUrl = movieData?.movie?.videoUrl || movieData?.movie?.video_url;

    if (!video || !videoUrl) return;

    let hls;
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [movieData]);

  // Format Thời gian (00:00)
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    if (hh > 0) {
      return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mm.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Điều khiển Video
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleRewind = () => { if (videoRef.current) videoRef.current.currentTime -= 10; };
  const handleForward = () => { if (videoRef.current) videoRef.current.currentTime += 10; };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    if (video.duration > 0 && video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBuffered((bufferedEnd / video.duration) * 100);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current && duration) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const changeSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSettings(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Xử lý bình luận
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentSubmitting(true);
    setCommentError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setCommentError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        setCommentSubmitting(false);
        return;
      }

      const res = await axios.post(
        '/api/comments',
        {
          movieId: Number(id),
          movie_id: Number(id),
          content: newComment.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        setNewComment('');
        try {
          const reloadRes = await getComments(id);
          const result = reloadRes.data?.data;
          if (!Array.isArray(result)) {
            throw new Error('Dữ liệu bình luận không hợp lệ.');
          }
          setCommentsState({ movieId: id, comments: result, loading: false, error: '' });
        } catch (reloadError) {
          console.error('Bình luận đã gửi nhưng không thể tải lại danh sách:', reloadError);
          setCommentError('Đã gửi bình luận nhưng không thể tải lại danh sách. Vui lòng tải lại trang.');
        }
      }
    } catch (err) {
      console.error('Lỗi bình luận:', err);
      setCommentError(
        err.response?.data?.message || 'Đã xảy ra lỗi trên hệ thống khi bình luận!'
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SiteLayout>
        <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>Đang tải phim...</div>
      </SiteLayout>
    );
  }
  if (error || !movieData?.movie) {
    return (
      <SiteLayout>
        <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>
          <h2>{error || 'Phim không tồn tại'}</h2>
          <Link to="/" style={{ color: '#ff4757', marginTop: '15px', display: 'inline-block' }}>Quay lại trang chủ</Link>
        </div>
      </SiteLayout>
    );
  }

  const { movie } = movieData;
  const commentsAreCurrent = commentsState.movieId === id;
  const comments = commentsAreCurrent ? commentsState.comments : [];
  const commentsLoading = !commentsAreCurrent || commentsState.loading;
  const commentsError = commentsAreCurrent ? commentsState.error : '';

  return (
    <SiteLayout>
    <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '0 15px', color: '#fff' }}>
      
      <Link to="/" style={{ color: '#aaa', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '15px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Quay lại danh sách phim
      </Link>

      {/* Trình phát Video Custom */}
      <div className="custom-player-wrapper" ref={containerRef} style={{ position: 'relative', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '25px' }}>
        {movie.videoUrl || movie.video_url ? (
          <>
            <video
              ref={videoRef}
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              crossOrigin="anonymous"
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />

            {/* Điều khiển trên Video */}
            <div className="player-controls" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Progress Bar */}
              <div onClick={handleSeek} style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.2)', cursor: 'pointer', borderRadius: '3px', position: 'relative' }}>
                <div style={{ height: '100%', background: 'rgba(255, 255, 255, 0.5)', width: `${buffered}%`, position: 'absolute', borderRadius: '3px' }} />
                <div style={{ height: '100%', background: '#ff4757', width: `${duration ? (currentTime / duration) * 100 : 0}%`, position: 'absolute', borderRadius: '3px' }} />
              </div>

              {/* Các nút điều khiển chuẩn UI web phim */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  
                  {/* Play / Pause */}
                  <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Phát/Tạm dừng">
                    {isPlaying ? (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    )}
                  </button>

                  {/* Tua lùi 10s */}
                  <button onClick={handleRewind} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }} title="Tua lùi 10s">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>
                    10s
                  </button>

                  {/* Tua tiến 10s */}
                  <button onClick={handleForward} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }} title="Tua tiến 10s">
                    10s
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>
                  </button>

                  {/* Âm thanh */}
                  <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {isMuted ? (
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    )}
                  </button>

                  <span style={{ fontSize: '0.85rem', color: '#ddd', fontFamily: 'monospace' }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
                  
                  {/* Cài đặt Tốc độ */}
                  <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Tốc độ phát">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  </button>

                  {showSettings && (
                    <div style={{ position: 'absolute', bottom: '40px', right: 0, background: 'rgba(20, 20, 20, 0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 0', width: '140px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#888', padding: '4px 12px', fontWeight: 'bold' }}>TỐC ĐỘ PHÁT</span>
                      {[0.5, 1.0, 1.5, 2.0].map((s) => (
                        <button
                          key={s}
                          onClick={() => changeSpeed(s)}
                          style={{ background: 'none', border: 'none', color: playbackSpeed === s ? '#ff4757' : '#ccc', padding: '6px 12px', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          x{s} {s === 1.0 && '(Chuẩn)'}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Toàn màn hình */}
                  <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Toàn màn hình">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', textAlign: 'center' }}>
            <h3 style={{ color: '#ff4757' }}>Phim hiện chưa có link xem video!</h3>
            <p style={{ color: '#aaa', marginTop: '5px' }}>Vui lòng quay lại sau hoặc chọn phim khác.</p>
          </div>
        )}
      </div>

      {/* Thông tin Phim */}
      <div style={{ display: 'flex', gap: '25px', background: 'rgba(20, 20, 20, 0.85)', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
        <div style={{ flexShrink: 0, width: '180px' }}>
          <img src={movie.posterUrl || movie.poster_url} alt={movie.title} style={{ width: '100%', borderRadius: '8px' }} />
        </div>
        <div style={{ flexGrow: 1 }}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '1.8rem', color: '#ff4757' }}>{movie.title}</h1>
          {movie.englishTitle && <h2 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#aaa', fontWeight: 'normal' }}>{movie.englishTitle}</h2>}
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px', fontSize: '0.9rem' }}>
            <span style={{ background: '#ff4757', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{movie.quality || 'FHD'}</span>
            
            {/* Rating Icon SVG */}
            <span style={{ color: '#ffa502', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              {movie.rating}
            </span>

            {/* Episode/Duration Icon SVG */}
            <span style={{ color: '#ccc', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {movie.episodes || 'Full'}
            </span>

            {/* Year Icon SVG */}
            <span style={{ color: '#ccc', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {movie.year}
            </span>
          </div>

          <p style={{ lineHeight: '1.6', color: '#ddd' }}>{movie.description}</p>
        </div>
      </div>

      {isAdmin && (
        <form
          onSubmit={handleGenreSubmit}
          style={{ background: '#1f1f1f', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
            <h3 style={{ margin: 0 }}>Thể loại phim</h3>
            <Link to="/admin/genres" style={{ color: '#ff6975', fontSize: '0.9rem' }}>
              Quản lý danh mục
            </Link>
          </div>
          {genres.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px' }}>
              {genres.map((genre) => (
                <label key={genre.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: '#ddd' }}>
                  <input
                    type="checkbox"
                    checked={selectedGenreIds.includes(Number(genre.id))}
                    onChange={(event) => {
                      setGenreMessage('');
                      const current = selectedGenreIds;
                      const ids = event.target.checked
                        ? [...current, Number(genre.id)]
                        : current.filter((genreId) => genreId !== Number(genre.id));
                      setGenreSelection({ movieId: id, ids });
                    }}
                  />
                  {genre.name}
                </label>
              ))}
            </div>
          ) : !genreError ? (
            <p style={{ color: '#aaa' }}>Chưa có thể loại. Hãy tạo thể loại trước.</p>
          ) : null}
          {genreError && <p role="alert" style={{ color: '#ff6975' }}>{genreError}</p>}
          {genreMessage && <p role="status" style={{ color: '#7bd8a7' }}>{genreMessage}</p>}
          <button
            type="submit"
            disabled={genreSaving || genres.length === 0}
            style={{ marginTop: '14px', padding: '9px 16px', border: 0, borderRadius: '7px', background: '#ff4757', color: '#fff', cursor: 'pointer' }}
          >
            {genreSaving ? 'Đang lưu...' : 'Lưu thể loại'}
          </button>
        </form>
      )}

      {/* Khung Bình luận */}
      <div style={{ background: '#1f1f1f', padding: '20px', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '8px', textAlign: 'center' }}>Bình luận</h3>
        
        {isAuthenticated ? (
          <form onSubmit={handleCommentSubmit} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Viết bình luận của bạn..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '6px', border: '1px solid #333', background: '#2b2b2b', color: '#fff', outline: 'none' }}
              />
              <button type="submit" disabled={commentSubmitting} style={{ padding: '0 20px', background: '#ff4757', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                {commentSubmitting ? 'Đang gửi...' : 'Gửi'}
              </button>
            </div>
            {commentError && <p style={{ color: '#ef5350', fontSize: '0.85rem', marginTop: '10px', textAlign: 'center' }}>{commentError}</p>}
          </form>
        ) : (
          <p style={{ color: '#aaa', marginBottom: '20px', textAlign: 'center' }}>
            Vui lòng <Link to="/login" style={{ color: '#ff4757' }}>Đăng nhập</Link> để viết bình luận.
          </p>
        )}

        {commentsLoading ? (
          <p style={{ color: '#aaa', textAlign: 'center' }} role="status">Đang tải bình luận...</p>
        ) : commentsError ? (
          <p style={{ color: '#ef5350', textAlign: 'center' }} role="alert">{commentsError}</p>
        ) : comments.length > 0 ? (
          comments.map((cmt, idx) => (
            <div key={cmt.id || idx} style={{ borderBottom: '1px solid #2a2a2a', padding: '10px 0' }}>
              <strong style={{ color: '#ff4757' }}>{cmt.username || cmt.fullname || cmt.full_name || 'Người dùng'}: </strong>
              <span>{cmt.content}</span>
            </div>
          ))
        ) : (
          <p style={{ color: '#aaa', textAlign: 'center' }}>Chưa có bình luận nào cho phim này.</p>
        )}
      </div>

    </div>
    </SiteLayout>
  );
}

export default Watch;