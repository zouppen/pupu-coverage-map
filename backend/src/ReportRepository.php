<?php

declare(strict_types=1);

namespace PupuCoverageMap;

use PDO;

final class ReportRepository
{
    public function __construct(private readonly PDO $db)
    {
    }

    /**
     * @param array{
     *   project: string,
     *   nick: string,
     *   email: string,
     *   receiver: string|null,
     *   feedback: string|null,
     *   reports: list<array{
     *     lat: float,
     *     lng: float,
     *     heard: array{a: bool, b: bool},
     *     observedAt: string,
     *     comment: string|null
     *   }>
     * } $submission
     */
    public function save(array $submission): int
    {
        $this->db->beginTransaction();

        try {
            $insertSubmission = $this->db->prepare(
                'insert into reception_reports (project, nick, email, receiver, feedback)
                 values (:project, :nick, :email, :receiver, :feedback)
                 returning id'
            );
            $insertSubmission->execute([
                ':project' => $submission['project'],
                ':nick' => $submission['nick'],
                ':email' => $submission['email'],
                ':receiver' => $submission['receiver'],
                ':feedback' => $submission['feedback'],
            ]);

            $submissionId = (int) $insertSubmission->fetchColumn();

            $insertReport = $this->db->prepare(
                'insert into reception_entries
                   (report_id, lat, lng, heard_a, heard_b, observed_at, comment)
                 values
                   (:report_id, :lat, :lng, :heard_a, :heard_b, :observed_at, :comment)'
            );

            foreach ($submission['reports'] as $report) {
                $insertReport->bindValue(':report_id', $submissionId, PDO::PARAM_INT);
                $insertReport->bindValue(':lat', $report['lat']);
                $insertReport->bindValue(':lng', $report['lng']);
                $insertReport->bindValue(':heard_a', $report['heard']['a'], PDO::PARAM_BOOL);
                $insertReport->bindValue(':heard_b', $report['heard']['b'], PDO::PARAM_BOOL);
                $insertReport->bindValue(':observed_at', $report['observedAt']);
                $insertReport->bindValue(':comment', $report['comment']);
                $insertReport->execute();
            }

            $this->db->commit();

            return $submissionId;
        } catch (\Throwable $error) {
            $this->db->rollBack();
            throw $error;
        }
    }
}
