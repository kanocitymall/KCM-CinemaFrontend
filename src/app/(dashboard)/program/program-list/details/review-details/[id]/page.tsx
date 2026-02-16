"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Spinner, Modal, Form, Row, Col, Dropdown } from "react-bootstrap";
import { BsStarFill, BsArrowLeft, BsPlusLg, BsThreeDotsVertical, BsTrash, BsCalendarDate, BsPersonCircle, BsSearch } from "react-icons/bs";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { toast } from "react-toastify";

// --- Interfaces ---
interface User { id: number; name: string; }
interface Program { id: number; title: string; }
interface Review {
  id: number;
  details: string;
  rating: number;
  review_date: string;
  user?: User;
}

export default function ReviewDetailsPage() {
  const params = useParams();
  const id = params?.id as string; 
  const router = useRouter();
  const api = useMemo(() => getApiClientInstance(), []);
  
  const [reviews, setReviews] = useState<Review[]>([]); 
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // States
  const [filters, setFilters] = useState({ start_date: "", end_date: "" });
  
  // Form State matching your JSON structure
  const [formData, setFormData] = useState({
    program_id: id || "", 
    details: "",
    rating: 5,
    review_date: new Date().toISOString().split('T')[0] 
  });

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.start_date) queryParams.append("start_date", filters.start_date);
      if (filters.end_date) queryParams.append("end_date", filters.end_date);

      const res = await api.get(`/programs/program-reviews/${id}?${queryParams.toString()}`);
      if (res.data?.success) {
        setCurrentProgram(res.data.data.program);
        setReviews(res.data.data.reviews.data || []);
      }
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [id, api, filters.start_date, filters.end_date]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]); 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "rating" ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/programs/make-review", formData);
      if (res.data?.success) {
        toast.success("Review posted successfully!");
        setShowAddModal(false);
        setFormData({ ...formData, details: "", rating: 5 }); // Reset text
        fetchData(); 
      }
    } catch {
      toast.error("Failed to submit review"); 
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="text-center py-5 vh-100 d-flex align-items-center justify-content-center">
      <Spinner animation="border" variant="warning" />
    </div>
  );

  return (
    <div className="container py-4">
      <div className="mx-auto" style={{ maxWidth: "800px" }}>
        
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button variant="white" className="btn-sm border shadow-sm" onClick={() => router.back()}>
            <BsArrowLeft /> Back
          </Button>

          <div className="d-flex gap-2">
            <Button variant="warning" className="btn-sm fw-bold shadow-sm" onClick={() => setShowAddModal(true)}>
              <BsPlusLg /> Write Review
            </Button>

            <Dropdown align="end">
              <Dropdown.Toggle variant="light" className="btn-sm border shadow-sm no-caret">
                <BsThreeDotsVertical />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setShowFilterModal(true)}>
                  <BsCalendarDate className="me-2" /> Date Range Search
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { setFilters({start_date: "", end_date: ""}); fetchData(); }}>
                  Reset All
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <h3 className="fw-bold mb-1">{currentProgram?.title}</h3>
        <p className="text-muted small mb-4">{reviews.length} total reviews found</p>

        {/* Reviews List */}
        {reviews.map((rev) => (
          <Card key={rev.id} className="shadow-sm border-0 mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  <BsPersonCircle className="fs-3 text-secondary" />
                  <div>
                    <div className="fw-bold small">{rev.user?.name}</div>
                    <div className="text-muted small" style={{fontSize: '10px'}}>{rev.review_date}</div>
                    <div className="text-warning small">
                      {[...Array(5)].map((_, i) => (
                        <BsStarFill key={i} className={i < rev.rating ? "me-1" : "text-light me-1"} />
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="outline-danger" size="sm" className="border-0" onClick={() => {/* delete logic */}}>
                  <BsTrash size={18} />
                </Button>
              </div>
              <p className="ps-4 ms-3 border-start mt-2 text-dark mb-0">{rev.details}</p>
            </Card.Body>
          </Card>
        ))}

        {/* --- MODAL: ADD REVIEW (Updated with your data) --- */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">New Review</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              {/* Program Display (Read Only) */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-uppercase text-muted">Reviewing Program</Form.Label>
                <Form.Control 
                  type="text" 
                  value={currentProgram?.title || "Loading..."} 
                  disabled 
                  className="bg-light border-0 fw-bold"
                />
                {/* Hidden input to ensure program_id is sent */}
                <input type="hidden" name="program_id" value={formData.program_id} />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Rating</Form.Label>
                    <Form.Select name="rating" value={formData.rating} onChange={handleInputChange}>
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Review Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      name="review_date" 
                      value={formData.review_date} 
                      onChange={handleInputChange} 
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Your Details</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={4} 
                  name="details" 
                  value={formData.details} 
                  onChange={handleInputChange} 
                  placeholder="Describe your experience with this program..." 
                  required 
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
              <Button variant="primary" type="submit" className="w-100 fw-bold py-2" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : "Submit Review"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* --- MODAL: DATE RANGE SEARCH --- */}
        <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered size="sm">
            <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold fs-6">Filter by Date</Modal.Title></Modal.Header>
            <Form onSubmit={(e) => { e.preventDefault(); setShowFilterModal(false); fetchData(); }}>
                <Modal.Body>
                    <Form.Control type="date" className="mb-2" value={filters.start_date} onChange={(e) => setFilters({...filters, start_date: e.target.value})} />
                    <Form.Control type="date" value={filters.end_date} onChange={(e) => setFilters({...filters, end_date: e.target.value})} />
                </Modal.Body>
                <Modal.Footer className="border-0"><Button variant="primary" type="submit" className="w-100"><BsSearch size={14}/> Search</Button></Modal.Footer>
            </Form>
        </Modal>

      </div>
    </div>
  );
}