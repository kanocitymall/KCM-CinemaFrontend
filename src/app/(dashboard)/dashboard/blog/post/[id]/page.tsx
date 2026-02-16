"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Modal from "react-bootstrap/Modal";
import Dropdown from "react-bootstrap/Dropdown";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import PermissionGuard from "../../../../components/PermissionGuard";

// --- Interfaces ---
interface PostImage {
  id: number;
  image_path: string;
  created_at: string;
}

interface PostType {
  id: number;
  name: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  Post_date: string;
  post_type_id: number;
  post_type: { name: string };
  author: { name: string };
  images: PostImage[];
}

interface AxiosError {
  response?: {
    data?: { message?: string };
  };
  message?: string;
}

export default function ViewPostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const BASE_URL = "https://halls.kanocitymall.com.ng/";

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showEditPost, setShowEditPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPostTypeId, setEditPostTypeId] = useState<number | string>("");
  const [editImagesFiles] = useState<File[]>([]);
  const [updatingPost, setUpdatingPost] = useState(false);
  const [updatePostError] = useState<string | null>(null);

  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  
  // ✅ FIXED: Correct destructuring here (was [ setLoadingTypes,])
  const [loadingTypes, setLoadingTypes] = useState(false);

  const [showImagesModal, setShowImagesModal] = useState(false);
  const [postImages, setPostImages] = useState<PostImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // --- API Handlers ---

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = getApiClientInstance();
      const res = await api.get(`/blog/show-post/${id}`);
      if (res?.data?.success) {
        setPost(res.data.data);
      } else {
        setError(res?.data?.message || 'Failed to load post');
        toast.error(res?.data?.message || 'Failed to load post');
      }
    } catch (err: unknown) {
      const e = err as AxiosError;
      const msg = e.response?.data?.message || e.message || 'Failed to load post';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPostTypes = useCallback(async () => {
    setLoadingTypes(true); // ✅ This will now work correctly
    try {
      const api = getApiClientInstance();
      const res = await api.get('/blog/post-types');
      const data = res?.data?.data;
      let arr: PostType[] = [];
      if (Array.isArray(data?.data)) arr = data.data;
      else if (Array.isArray(data)) arr = data;
      else if (Array.isArray(res?.data)) arr = res.data;
      setPostTypes(arr);
    } catch (err: unknown) {
      const e = err as AxiosError;
      console.error('Fetch post-types error:', e.response?.data || e.message);
      setPostTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  const fetchPostImages = useCallback(async () => {
    setLoadingImages(true);
    try {
      const api = getApiClientInstance();
      const res = await api.get(`/blog/post-images/${id}`);
      if (res?.data?.success) {
        setPostImages(res.data.data || []);
      } else {
        setPostImages([]);
      }
    } catch (err: unknown) {
      const e = err as AxiosError;
      console.error('Fetch post images error:', e.response?.data || e.message);
      setPostImages([]);
    } finally {
      setLoadingImages(false);
    }
  }, [id]);

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    setDeletingImageId(imageId);
    try {
      const api = getApiClientInstance();
      const res = await api.delete(`/blog/delete-post-image/${imageId}`);

      if (res?.data?.success) {
        toast.success(res.data.message || 'Image deleted!');
        setPostImages(prev => prev.filter(img => img.id !== imageId));
        if (post) {
          setPost(prevPost => prevPost ? ({
            ...prevPost,
            images: prevPost.images.filter(img => img.id !== imageId)
          }) : null);
        }
      } else {
        toast.error(res?.data?.message || 'Failed to delete image.');
      }
    } catch (err: unknown) {
      const e = err as AxiosError;
      toast.error(e.response?.data?.message || 'An error occurred.');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure? This deletes the post and images.")) return;
    try {
      const api = getApiClientInstance();
      const res = await api.delete(`/blog/delete-post/${id}`);
      if (res?.data?.success) {
        toast.success('Post successfully deleted!');
        router.push('/dashboard/blog');
      }
    } catch (err: unknown) {
      const e = err as AxiosError;
      toast.error(e.response?.data?.message || 'Error deleting post.');
    }
  };

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchPostTypes();
    }
  }, [id, fetchPost, fetchPostTypes]);

  useEffect(() => {
    if (showImagesModal) {
      fetchPostImages();
    }
  }, [showImagesModal, fetchPostImages]);

  const getFormattedDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  };

  if (loading) return <div className="container py-4 text-center"><p>Loading post...</p></div>;
  if (error || !post) return <div className="container py-4 text-center"><Alert variant="danger">{error || 'Post not found'}</Alert></div>;

  const formattedDate = getFormattedDate(post.Post_date);

  return (
    <>
      <style jsx>{`
        .post-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; color: white; }
        .post-content { line-height: 1.8; white-space: pre-line; }
        .delete-btn-overlay { position: absolute; top: 5px; right: 5px; z-index: 10; }
        .img-container { position: relative; width: 100%; height: 400px; overflow: hidden; border-radius: 12px; }
      `}</style>

      <section className="container py-4">
        <div className="row mb-4">
          <div className="col-12 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3 post-header p-3 rounded w-100 me-3">
              <Button variant="outline-light" onClick={() => router.back()}>Back</Button>
              <div>
                <h1 className="mb-1 fw-bold">{post.title}</h1>
                <small>{post.author?.name}{formattedDate ? ` | ${formattedDate}` : ''}</small>
              </div>
            </div>
            <Dropdown>
              <Dropdown.Toggle variant="secondary" className="rounded-circle shadow-sm" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-gear-fill"></i>
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ minWidth: '220px' }}>
                <Dropdown.Item onClick={() => setShowImagesModal(true)}>View Images</Dropdown.Item>
                <Dropdown.Item onClick={() => {
                  setShowEditPost(true);
                  setEditTitle(post.title);
                  setEditContent(post.content);
                  setEditPostTypeId(post.post_type_id);
                }}>Edit Post</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleDeletePost} className="text-danger">Delete Post</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {post.images && post.images.length > 0 && (
          <div className="row g-3 mb-4">
            {post.images.map((img, idx) => (
              <div key={img.id} className={`col-${post.images.length === 1 ? '12' : post.images.length === 2 ? '6' : '4'}`}>
                <div className="img-container">
                  <Image 
                    src={`${BASE_URL}${img.image_path}`}
                    alt={`Post image ${idx + 1}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized 
                  />
                  <div className="delete-btn-overlay">
                    <PermissionGuard permission="Delete Post Image">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteImage(img.id)}
                        disabled={deletingImageId === img.id}
                        className="rounded-circle"
                      >
                        {deletingImageId === img.id ? '...' : '×'}
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          <div className="card-body p-5">
            <h4 className="fw-bold mb-3 text-primary">Post Content</h4>
            <div className="post-content fs-5 text-dark">{post.content}</div>
          </div>
        </div>
      </section>

      {/* --- Edit Modal --- */}
      <Modal show={showEditPost} onHide={() => setShowEditPost(false)} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Edit Blog Post</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {updatePostError && <Alert variant="danger">{updatePostError}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Select 
                value={editPostTypeId} 
                onChange={(e) => setEditPostTypeId(e.target.value)}
                disabled={loadingTypes}
            >
              <option value="">{loadingTypes ? "Loading..." : "Choose category..."}</option>
              {postTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Content</Form.Label>
            <Form.Control as="textarea" rows={8} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
          </Form.Group>
          <p className="text-muted small">Add images via the &apos;Edit Post&apos; option.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditPost(false)}>Cancel</Button>
          <Button variant="primary" disabled={updatingPost} onClick={async () => {
            setUpdatingPost(true);
            try {
              const api = getApiClientInstance();
              const form = new FormData();
              form.append('post_type_id', String(editPostTypeId));
              form.append('title', editTitle);
              form.append('content', editContent);
              editImagesFiles.forEach(f => form.append('images[]', f));
              const res = await api.post(`/blog/update-post/${id}`, form);
              if (res?.data?.success) {
                toast.success('Updated!');
                setShowEditPost(false);
                fetchPost();
                fetchPostImages();
              }
            } catch (err: unknown) {
              const e = err as AxiosError;
              toast.error(e.response?.data?.message || 'Update failed');
            } finally {
              setUpdatingPost(false);
            }
          }}>
            {updatingPost ? "Updating..." : "Update Post"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* --- Images Management Modal --- */}
      <Modal show={showImagesModal} onHide={() => setShowImagesModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Image Gallery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingImages ? <p>Loading...</p> : (
            <div className="row g-3">
              {postImages.map((img) => (
                <div key={img.id} className="col-md-4 position-relative">
                  <div style={{ position: 'relative', width: '100%', height: '150px' }}>
                    <Image 
                      src={`${BASE_URL}${img.image_path}`} 
                      alt="Gallery" 
                      fill 
                      style={{ objectFit: 'cover', borderRadius: '8px' }}
                      unoptimized 
                    />
                    <div className="delete-btn-overlay">
                      <Button variant="danger" size="sm" onClick={() => handleDeleteImage(img.id)} disabled={deletingImageId === img.id}>
                        {deletingImageId === img.id ? '...' : '×'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}