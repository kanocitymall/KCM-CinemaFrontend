"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import PermissionGuard from "../../components/PermissionGuard";
import { AxiosError } from "axios";

// --- Interfaces ---
interface Author {
  name: string;
}

interface PostType {
  id: number;
  name: string;
}

interface PostImage {
  id: number;
  image_path: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author?: Author;
  post_type?: PostType;
  images: PostImage[];
  created_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
}

const NEW_PRIMARY_COLOR = "#aa1c2aff";
const LIGHT_PRIMARY_COLOR = "rgba(170, 28, 42, 0.15)";
const BASE_IMAGE_URL = "https://halls.kanocitymall.com.ng";

export default function BlogPage() {
  const router = useRouter();

  // State Management
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Fixed unused warning
  const [totalPages, setTotalPages] = useState(1); // Fixed unused warning

  // Form State
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postTypeId, setPostTypeId] = useState<number | string>("");
  const [imagesFiles, setImagesFiles] = useState<File[]>([]);
  const [creatingPost, setCreatingPost] = useState(false);
  const [createPostError, setCreatePostError] = useState<string | null>(null);

  const fetchPostTypes = async () => {
    try {
      const api = getApiClientInstance();
      const res = await api.get("/blog/post-types");
      const data = res?.data?.data;

      let arr: PostType[] = [];
      if (Array.isArray(data?.data)) arr = data.data;
      else if (Array.isArray(data)) arr = data;

      setPostTypes(arr);
    } catch (err: unknown) { // Replaced any
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || "Failed to fetch post types");
      setPostTypes([]);
    }
  };

  const fetchPosts = async (page = 1) => {
    setLoadingPosts(true);
    try {
      const api = getApiClientInstance();
      const res = await api.get("/blog/posts", { params: { page } });
      const data: PaginatedResponse<Post> = res?.data?.data;

      setPosts(data?.data || []);
      setCurrentPage(data?.current_page || 1);
      setTotalPages(data?.last_page || 1);
    } catch (err: unknown) { // Replaced any
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error?.response?.data?.message || "Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCreatePost = async () => {
    setCreatePostError(null);
    if (!postTypeId || !postTitle.trim() || !postContent.trim()) {
      setCreatePostError("Post type, title and content are required");
      return;
    }

    setCreatingPost(true);
    try {
      const api = getApiClientInstance();
      const form = new FormData();
      form.append("post_type_id", String(postTypeId));
      form.append("title", postTitle.trim());
      form.append("content", postContent.trim());
      imagesFiles.forEach((f) => form.append("images[]", f));

      const res = await api.post("/blog/create-post", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.data?.success) {
        toast.success(res.data.message || "Post created");
        setPostTitle(""); setPostContent(""); setPostTypeId(""); setImagesFiles([]);
        setShowCreatePost(false);
        fetchPosts(1);
      } else {
        setCreatePostError(res?.data?.message || "Failed to create post");
      }
    } catch (err: unknown) { // Replaced any
      const error = err as AxiosError<{ message?: string }>;
      const msg = error?.response?.data?.message || "Failed to create post";
      setCreatePostError(msg);
      toast.error(msg);
    } finally {
      setCreatingPost(false);
    }
  };

  useEffect(() => {
    fetchPostTypes();
    fetchPosts(1);
  }, []);

  const removeImageFile = (indexToRemove: number) => {
    setImagesFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const getFullImageUrl = (path: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${BASE_IMAGE_URL}${cleanPath}`;
  };

  return (
    <>
      <style jsx>{`
        .bg-new-primary { background-color: ${NEW_PRIMARY_COLOR} !important; }
        .blog-modal .modal-content { border: none; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); overflow: hidden; }
        .form-control:focus, .form-select:focus { border-color: ${NEW_PRIMARY_COLOR} !important; box-shadow: 0 0 0 0.2rem ${LIGHT_PRIMARY_COLOR} !important; }
        .card { transition: all 0.3s ease; border-radius: 16px; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
      `}</style>

      <section className="container py-4">
        {/* Header */}
        <div className="row mb-5">
          <div className="col-12">
              <div className="card border-0 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #faae21ff, #f78809)', borderRadius: '20px' }}>
              <div className="card-body p-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                <h1 className="mb-3 mb-md-0 fw-bold"><i className="bi bi-journal-bookmark-fill me-3"></i>Post Management</h1>
                <div className="d-flex flex-column flex-md-row gap-3">
                  <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
                    <PermissionGuard permission="Get All Post Types">
                      <Button variant="light" onClick={() => router.push('/dashboard/blog/post-types')} className="fw-bold px-3 mb-2 mb-md-0">
                        <i className="bi bi-tags-fill me-2"></i>Post Types
                      </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="Create Post">
                      <Button variant="light" onClick={() => setShowCreatePost(true)} className="fw-bold px-3">
                        <i className="bi bi-plus-circle-fill me-2"></i>Create Post
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Post Grid */}
        <div className="row g-4">
          {loadingPosts ? (
            <div className="col-12 text-center py-5"><div className="spinner-border text-danger" /></div>
          ) : posts.length === 0 ? (
            <div className="col-12 text-center py-5"><h5>No posts found</h5></div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="col-lg-6 col-xl-4">
                <div className="card h-100 border-0 shadow-sm overflow-hidden">
                  {post.images && post.images.length > 0 && (
                    <div style={{ position: 'relative', height: '200px' }}>
                      <Image
                        src={getFullImageUrl(post.images[0].image_path)}
                        alt={post.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="card-body p-4">
                    <h5 className="fw-bold">{post.title}</h5>
                    <p className="text-muted small mb-2">
                      <i className="bi bi-person me-1"></i>{post.author?.name} • {new Date(post.created_at).toLocaleDateString()}
                    </p>
                    <span className="badge bg-light text-dark mb-3">{post.post_type?.name}</span>
                    <p className="text-secondary mb-4">
                      {post.content?.length > 120 ? `${post.content.substring(0, 120)}...` : post.content}
                    </p>
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      <small className="text-muted">{post.images?.length || 0} images</small>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => router.push(`/dashboard/blog/post/${post.id}`)}
                      >
                        View Post
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Info */}
        <div className="mt-4 text-center">
            <small className="text-muted">Page {currentPage} of {totalPages}</small>
        </div>

        {/* Create Post Modal */}
        <Modal show={showCreatePost} onHide={() => setShowCreatePost(false)} centered size="lg" className="blog-modal">
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Publish New Content</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {createPostError && <Alert variant="danger">{createPostError}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Category</Form.Label>
              <Form.Select value={postTypeId} onChange={(e) => setPostTypeId(e.target.value)}>
                <option value="">Select Category</option>
                {postTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Title</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter post title" 
                value={postTitle} 
                onChange={(e) => setPostTitle(e.target.value)} 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Content</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={5} 
                placeholder="Write your story..." 
                value={postContent} 
                onChange={(e) => setPostContent(e.target.value)} 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Images</Form.Label>
              <Form.Control 
                type="file" 
                multiple 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files) setImagesFiles(Array.from(e.target.files));
                }} 
              />
              <div className="mt-2 d-flex flex-wrap gap-2">
                {imagesFiles.map((file, idx) => (
                  <div key={idx} className="badge bg-secondary p-2">
                    {file.name} 
                    <i className="bi bi-x-circle ms-2" style={{ cursor: 'pointer' }} onClick={() => removeImageFile(idx)}></i>
                  </div>
                ))}
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="bg-light border-0">
            <Button variant="link" className="text-decoration-none text-muted" onClick={() => setShowCreatePost(false)}>Cancel</Button>
            <Button 
              style={{ backgroundColor: NEW_PRIMARY_COLOR, border: 'none', borderRadius: '10px' }} 
              className="px-4 py-2"
              onClick={handleCreatePost} 
              disabled={creatingPost}
            >
              {creatingPost ? "Creating..." : "Create Post"}
            </Button>
          </Modal.Footer>
        </Modal>
      </section>
    </>
  );
}