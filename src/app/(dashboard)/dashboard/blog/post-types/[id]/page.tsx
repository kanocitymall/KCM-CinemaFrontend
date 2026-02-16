"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image"; 
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Dropdown from "react-bootstrap/Dropdown";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { AxiosResponse } from 'axios';
import PermissionGuard from "../../../../components/PermissionGuard";

// --- Types ---
interface PostType {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  posts_count: number;
}

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  post_type_id: number;
  post_type: { name: string };
  author: { name: string };
  images: Array<{
    id: number;
    image_path: string;
    created_at: string;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type PostListData = Post[] | { data: Post[] } | { posts: Post[] };
type PostListResponse = ApiResponse<PostListData>;
type PostTypeResponse = ApiResponse<PostType>;

interface ApiError {
  response?: {
    data?: { message?: string };
  };
  message?: string;
}

const NEW_PRIMARY_COLOR = "#AA1C2A";
// const LIGHT_PRIMARY_COLOR = "rgba(170, 28, 42, 0.1)";
const BASE_URL = "https://halls.kanocitymall.com.ng"; 

export default function PostTypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [postType, setPostType] = useState<PostType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for Editing/Deleting
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  // ✅ Fix: Prevents double slashes or missing slashes
  const getImageUrl = (path: string) => {
    if (!path) return "";
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
  };

  const fetchPostType = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = getApiClientInstance();
      const res: AxiosResponse<PostTypeResponse> = await api.get(`/blog/show-post-type/${id}`);
      if (res?.data?.success) {
        setPostType(res.data.data);
      } else {
        setError(res?.data?.message || 'Failed to load post type');
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.response?.data?.message || e.message || 'Error loading post type');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPostsByType = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const api = getApiClientInstance();
      const res: AxiosResponse<PostListResponse> = await api.get(`/blog/posts-by-type/${id}`);
      if (res?.data?.success) {
        const responseData = res.data.data;
        let postsArray: Post[] = [];
        if (Array.isArray(responseData)) {
          postsArray = responseData;
        } else if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
          postsArray = responseData.data;
        }
        setPosts(postsArray);
      }
    } catch (e) {
      console.error("Failed to fetch posts", e);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [id]);

  const deletePostType = async () => {
    if (!window.confirm('Are you sure you want to delete this post type?')) return;
    setDeleting(true);
    try {
      const api = getApiClientInstance();
      const res = await api.delete(`/blog/delete-post-type/${id}`);
      if (res?.data?.success) {
        toast.success('Deleted successfully');
        router.push('/dashboard/blog');
      }
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditPostType = async () => {
    setUpdating(true);
    try {
      const api = getApiClientInstance();
      const res = await api.put(`/blog/update-post-type/${id}`, {
        name: editName,
        description: editDescription
      });
      if (res?.data?.success) {
        toast.success('Updated successfully');
        setPostType(prev => prev ? { ...prev, name: editName, description: editDescription } : null);
        setShowEditModal(false);
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const openEditModal = () => {
    if (postType) {
      setEditName(postType.name);
      setEditDescription(postType.description);
      setShowEditModal(true);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPostType();
      fetchPostsByType();
    }
  }, [id, fetchPostType, fetchPostsByType]);

  if (loading) return (
    <div className="container py-5 text-center vh-100 d-flex flex-column justify-content-center align-items-center">
      <div className="spinner-border" style={{ color: NEW_PRIMARY_COLOR }} />
      <p className="mt-3">Loading category details...</p>
    </div>
  );

  if (error || !postType) return (
    <section className="container py-5 text-center">
      <Alert variant="danger">{error || 'Category not found'}</Alert>
      <Button variant="secondary" onClick={() => router.back()}>Go Back</Button>
    </section>
  );

  return (
    <>
      <style jsx>{`
        .post-type-header { background: #faae21ff; border-radius: 20px; color: white; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); }
        .post-card { transition: all 0.3s ease; border-radius: 16px; overflow: hidden; border: 1px solid #e0e0e0; }
        .post-card:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1); }
        .post-image-container { position: relative; height: 220px; width: 100%; background: #f8f9fa; }
        .post-content-preview { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <section className="container py-4">
        {/* Header with Edit/Delete Controls */}
        <div className="post-type-header p-5 mb-5 d-flex justify-content-between align-items-start">
          <div>
            <Button variant="outline-light" onClick={() => router.back()} className="mb-3">Back</Button>
            <h1 className="fw-bolder display-5">{postType.name}</h1>
            <p className="fs-5 opacity-90">{postType.description}</p>
            <span className="badge bg-white text-dark p-2">Total Posts: {postType.posts_count}</span>
          </div>

          <Dropdown>
            <Dropdown.Toggle variant="light" className="rounded-circle shadow-sm">
              <i className="bi bi-three-dots-vertical"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={openEditModal}>
                <i className="bi bi-pencil me-2"></i>Edit Category
              </Dropdown.Item>
              <Dropdown.Item onClick={deletePostType} className="text-danger" disabled={deleting}>
                <i className="bi bi-trash me-2"></i>{deleting ? 'Deleting...' : 'Delete Category'}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Posts List */}
        <h3 className="mb-4 fw-bold">All Posts in {postType.name}</h3>

        {loadingPosts ? (
          <div className="text-center py-5"><div className="spinner-border" style={{ color: NEW_PRIMARY_COLOR }} /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-5 bg-light rounded-4"><h4>No Posts Found</h4></div>
        ) : (
          <div className="row g-4">
            {posts.map((post) => (
              <div key={post.id} className="col-lg-4 col-md-6">
                <div className="card post-card h-100">
                  <div className="post-image-container">
                    {post.images && post.images.length > 0 ? (
                      <Image
                        src={getImageUrl(post.images[0].image_path)}
                        alt={post.title}
                        fill
                        unoptimized
                        className="object-fit-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                        <i className="bi bi-image fs-1"></i>
                      </div>
                    )}
                  </div>

                  <div className="card-body d-flex flex-column p-4">
                    <h5 className="card-title fw-bold text-truncate">{post.title}</h5>
                    <p className="text-secondary small post-content-preview">{post.content}</p>
                    <div className="mt-auto pt-3">
                      <PermissionGuard permission="View Posts">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => router.push(`/dashboard/blog/post/${post.id}`)}
                          style={{ borderColor: NEW_PRIMARY_COLOR, color: NEW_PRIMARY_COLOR }}
                        >
                          View Post
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Post Type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control 
              type="text"
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={editDescription} 
              onChange={(e) => setEditDescription(e.target.value)} 
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={handleEditPostType} 
            disabled={updating || !editName.trim()}
            style={{ backgroundColor: NEW_PRIMARY_COLOR, borderColor: NEW_PRIMARY_COLOR }}
          >
            {updating ? 'Updating...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}