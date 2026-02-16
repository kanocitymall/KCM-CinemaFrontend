"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { MdAdd } from "react-icons/md";
// import { IoFilter } from "react-icons/io5";
import Modal from "react-bootstrap/Modal";
import Carousel from "react-bootstrap/Carousel";
import Link from "next/link";
import { toast } from "react-toastify";
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import PageHeader from "../../components/page-header";
import Loading from "../../components/loading";
import CreateHallForm from "./components/CreateHallForm";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import PermissionGuard from "../../components/PermissionGuard";

// --- Interfaces ---
interface HallImage {
  id: number;
  image_path: string;
}

interface Hall {
  id: number;
  name: string;
  images?: HallImage[];
}

// interface Permission {
//   name: string;
// }

const Halls = () => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [refetch, setRefetch] = useState(false);
  const [search, setSearch] = useState("");

  const api = useMemo(() => getApiClientInstance(), []);
  
  // ✅ FIX 1: Ensure BASE_URL doesn't conflict with path slashes
  const BASE_URL = "https://cinemaapi.kanocitymall.com.ng"; 

  const authUser = useSelector((state: RootState) => state.auth.main.user);
  const isSuperAdmin = authUser?.role?.name?.toLowerCase().includes("admin");

  const fetchHalls = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/halls");
      setHalls(res.data?.data || []);
    } catch {
      toast.error("Failed to fetch halls");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchHalls();
  }, [fetchHalls]);

  useEffect(() => {
    if (refetch) {
      fetchHalls();
      setRefetch(false);
      setShowModal(false);
    }
  }, [refetch, fetchHalls]);

  const filteredHalls = halls.filter((hall) =>
    hall.name.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ FIX 2: Better URL Sanitization
  const getFullUrl = (path: string) => {
    if (!path) return "/no-image.jpg";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
  };

  return (
    <section>
      <PageHeader title="Halls List">
        <div className="d-flex gap-2 align-items-center">
          <input
            type="search"
            className="form-control d-none d-md-block"
            placeholder="Search halls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isSuperAdmin && (
            <PermissionGuard permission="Create Hall">
            <button className="btn btn-warning d-flex align-items-center gap-2 text-nowrap" onClick={() => setShowModal(true)}>
              <MdAdd /> Add Hall
            </button>
            </PermissionGuard>
          )}
        </div>
      </PageHeader>

      {loading ? <Loading /> : (
        <div className="row mt-4">
          {filteredHalls.map((hall) => (
            <div key={hall.id} className="col-md-4 mb-4">
              <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100">
                
                {/* Image Section */}
                <div style={{ height: "220px", position: "relative", backgroundColor: "#f8f9fa" }}>
                  {hall.images && hall.images.length > 0 ? (
                    <Carousel interval={null} indicators={false}>
                      {hall.images.map((img) => (
                        <Carousel.Item key={img.id}>
                          <div style={{ height: "220px", position: "relative" }}>
                            <Image
                              src={getFullUrl(img.image_path)}
                              alt={hall.name}
                              fill
                              unoptimized
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        </Carousel.Item>
                      ))}
                    </Carousel>
                  ) : (
                    <Image
                      src="/no-image.jpg" // Local fallback or getFullUrl("storage/halls/no-image.jpg")
                      alt="No image"
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  )}
                </div>

                <div className="card-body d-flex flex-column justify-content-between">
                  <h5 className="fw-bold text-dark">{hall.name}</h5>
                  <PermissionGuard permission="Show Hall">
                  <Link href={`/hall/hall-list/details/${hall.id}`} className="btn btn-outline-primary btn-sm w-100 mt-2">
                    View Details
                  </Link>
                  </PermissionGuard>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ FIX 3: Changed 'hall' prop to 'hallId' to match your Form component */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Hall</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CreateHallForm hallId={null} setRefetch={setRefetch} onClose={() => setShowModal(false)} />
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default Halls;