import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

// Constants
const PACKAGE_ID = '0x21525a8d7469d45dbb9a4ae89c2a465816c71cb495127ae8b3a2d4dda2083cf3';
const MODULE_NAME = 'academy';

interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  studentName: string;
  testScore: number;
  completionDate: number;
}

export default function MyCertificates() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    async function loadCertificates() {
      if (!currentAccount?.address) {
        setLoading(false);
        return;
      }

      try {
        // Query for CourseCertificate objects owned by the current account
        const objects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::CourseCertificate`,
          },
          options: {
            showContent: true,
          },
        });

        const certs: Certificate[] = [];
        
        for (const obj of objects.data) {
          if (obj.data?.content?.dataType === 'moveObject') {
            const fields = obj.data.content.fields as any;
            
            // Try to get course name from course object
            let courseName = 'Course';
            try {
              const courseObj = await suiClient.getObject({
                id: fields.course_id,
                options: { showContent: true },
              });
              if (courseObj.data?.content?.dataType === 'moveObject') {
                const courseFields = courseObj.data.content.fields as any;
                courseName = courseFields.title || 'Course';
              }
            } catch (e) {
              console.error('Error fetching course:', e);
            }

            certs.push({
              id: obj.data.objectId,
              courseId: fields.course_id,
              courseName: courseName,
              studentName: fields.student_name,
              testScore: parseInt(fields.test_score),
              completionDate: parseInt(fields.completion_date),
            });
          }
        }

        setCertificates(certs);
      } catch (error) {
        console.error('Error loading certificates:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCertificates();
  }, [currentAccount?.address, suiClient]);

   const getGradeInfo = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: '#10b981', bgGradient: 'linear-gradient(135deg, #10b981, #059669)', label: 'Excellent' };
    if (score >= 80) return { grade: 'A', color: '#3b82f6', bgGradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', label: 'Great' };
    if (score >= 70) return { grade: 'B', color: '#8b5cf6', bgGradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', label: 'Good' };
    return { grade: 'C', color: '#f59e0b', bgGradient: 'linear-gradient(135deg, #f59e0b, #d97706)', label: 'Pass' };
  };

  const formatDate = (timestamp: number) => {
    // Handle invalid or zero timestamps
    if (!timestamp || timestamp < 1000000000) {
      return new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return new Date(timestamp).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="certificates-page">
        <div className="certificates-loading">
          <div className="loading-spinner"></div>
          <p>Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="certificates-page">
      {/* Page Header */}
      <div className="certificates-header">
        <div className="header-content">
          <div className="header-icon">🏆</div>
          <div className="header-text">
            <h1>My certificates</h1>
            <p>The Soulbound NFT certificates you have earned on-chain</p>
          </div>
        </div>
        {certificates.length > 0 && (
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-number">{certificates.length}</span>
              <span className="stat-label">Certificates</span>
            </div>
          </div>
        )}
      </div>

      {certificates.length === 0 ? (
        <div className="empty-certificates">
          <div className="empty-illustration">
            <svg viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" fill="#f1f5f9"/>
              <path d="M100 60l20 40h-40l20-40z" fill="#e2e8f0"/>
              <rect x="60" y="100" width="80" height="50" rx="4" fill="#cbd5e1"/>
              <circle cx="100" cy="80" r="15" fill="#94a3b8"/>
            </svg>
          </div>
          <h3>No certificates yet</h3>
          <p>Complete courses and pass the quizzes to earn Soulbound NFT certificates!</p>
          <a href="/" className="explore-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            Explore courses
          </a>
        </div>
      ) : (
        <div className="certificates-grid">
          {certificates.map((cert) => {
            const gradeInfo = getGradeInfo(cert.testScore);
            return (
              <div 
                key={cert.id} 
                className="certificate-card"
                onClick={() => setSelectedCert(cert)}
              >
                {/* Certificate Visual */}
                <div className="cert-visual" style={{ background: gradeInfo.bgGradient }}>
                  <div className="cert-pattern"></div>
                  <div className="cert-icon">🎓</div>
                  <div className="cert-score">
                    <span className="score-value">{cert.testScore}</span>
                    <span className="score-percent">%</span>
                  </div>
                  <div className="cert-grade-badge">
                    <span className="grade-letter">{gradeInfo.grade}</span>
                    <span className="grade-label">{gradeInfo.label}</span>
                  </div>
                </div>

                {/* Certificate Info */}
                <div className="cert-info">
                  <h3 className="cert-course-name">{cert.courseName}</h3>
                  <p className="cert-student-name">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    {cert.studentName}
                  </p>
                  <p className="cert-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {formatDate(cert.completionDate)}
                  </p>
                </div>

                {/* Soulbound Badge */}
                <div className="cert-footer">
                  <span className="soulbound-tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Soulbound NFT
                  </span>
                  <span className="view-detail">View details →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Certificate Detail Modal */}
      {selectedCert && (
        <div className="cert-modal-overlay" onClick={() => setSelectedCert(null)}>
          <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCert(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            {/* Certificate Display */}
            <div className="cert-display">
              <div className="cert-display-header">
                <div className="cert-logo">🎓</div>
                <h2>CERTIFICATE OF COMPLETION</h2>
                <p className="cert-subtitle">SuiCert Academy</p>
              </div>

              <div className="cert-display-body">
                <p className="cert-awarded-to">Awarded to</p>
                <h3 className="cert-recipient">{selectedCert.studentName}</h3>
                <p className="cert-completion-text">
                  Has successfully completed the course
                </p>
                <h4 className="cert-course-title">{selectedCert.courseName}</h4>
                
                <div className="cert-score-display">
                  <div className="score-circle" style={{ borderColor: getGradeInfo(selectedCert.testScore).color }}>
                    <span className="score-num">{selectedCert.testScore}%</span>
                    <span className="score-label">Score</span>
                  </div>
                </div>

                <div className="cert-date-display">
                  Completion date: {formatDate(selectedCert.completionDate)}
                </div>
              </div>

              <div className="cert-display-footer">
                <div className="blockchain-info">
                  <span className="blockchain-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Soulbound NFT on Sui Blockchain
                  </span>
                </div>
                <a
                  href={`https://suiscan.xyz/testnet/object/${selectedCert.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-on-chain"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  View on Sui Explorer
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
