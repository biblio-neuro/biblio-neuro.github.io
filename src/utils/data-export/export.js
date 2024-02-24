import { getDoximityMatchedIndividual } from "../doximity/individual";

const extractRowExport = (entry, programInfo, doximityUserData) => {
    const {
        author_last_education_name,
        author_last_ama_program_name,
        author_last_program_id,
        author_first_display_name,
        author_first_edu_level,
        first_author_student,
        author_last_display_name,
        author_last_position_rank,
        id_doi,
        id_pmid,
        publication_date,
        author_last_affiliation_match,
        rcrStats,
        author_first_semantic_id,
        author_last_semantic_id,
        authors,
        sem_authors,
        publication_citation_count,
        author_first_paper_count,
        author_first_citation_count,
        author_first_hindex,
        author_last_paper_count,
        author_last_citation_count,
        author_last_hindex,
        author_last_THA_city,
        author_last_THA_state,
        author_last_program_setting,
        author_last_num_residents_on_duty,
        author_last_director_phd
    } = entry;
    const pubDate = (typeof publication_date === 'number' && !Number.isNaN(publication_date))
                    ? new Date(publication_date).toISOString().split('T')[0] 
                    : publication_date
    let row =  {
        id_doi,
        id_pmid,
        publication_date : pubDate,
        publication_citation_count,
    }
    row = {
        ...row,
        publication_title: rcrStats?.title,
        publication_journal: rcrStats?.journal,
        publication_is_research_article : rcrStats?.is_research_article,
        publication_rcr : rcrStats?.relative_citation_ratio,
        publication_nih_percentile : rcrStats?.nih_percentile,
        pulication_human : rcrStats?.human,
        pulication_animal : rcrStats?.animal,
        pulication_molecular_cellular : rcrStats?.molecular_cellular,
        pulication_is_clinical : rcrStats?.is_clinical,
        pulication_citations_per_year : rcrStats?.citations_per_year,
        pulication_expected_citations_per_year : rcrStats?.expected_citations_per_year,
        pulication_field_citation_rate : rcrStats?.field_citation_rate,
    }
    const program = author_last_program_id && programInfo[author_last_program_id];
    row = {
        ...row,                
        program_fac_ft_paid_physician : program?.fac_ft_paid_physician,
        program_fac_ft_paid_non_physician: program?.fac_ft_paid_non_physician,
        program_fac_percent_ft_female : program?.fac_percent_ft_female,
        program_work_avg_hrs_week : program?.work_avg_hrs_week,
        program_work_moonlight : program?.work_moonlight,
        program_work_nightfloat : program?.work_nightfloat,
        program_gov_affiliation : program?.gov_affiliation,
        program_appinfo_ratio_interviews_pgy1positions : program?.appinfo_ratio_interviews_pgy1positions,
        program_work_max_consec_hours_pgy1 : program?.work_max_consec_hours_pgy1,
        program_work_avg_24h_off_duty_periods_per_week_pgy1 : program?.work_avg_24h_off_duty_periods_per_week_pgy1,
        program_comp_sal_paid_by_nonprofit : program?.comp_sal_paid_by_nonprofit,
        program_comp_num_paid_days_fam_med_leave : program?.comp_num_paid_days_fam_med_leave,
        program_comp_pgy_1_sal_usd : program?.comp_pgy_1_sal_usd,
        program_comp_pgy_1_vac_days : program?.comp_pgy_1_vac_days,
        program_comp_pgy_7_sal_usd : program?.comp_pgy_7_sal_usd,
        program_comp_pgy_7_vac_days : program?.comp_pgy_7_vac_days,
        program_edu_env_didactic_hrs_week : program?.edu_env_didactic_hrs_week,
        program_edu_env_pgy1_outpatient_hours : program?.edu_env_pgy1_outpatient_hours
    }

    const doximityFirstAuthor = getDoximityMatchedIndividual(doximityUserData, author_first_display_name);
    const doximityLastAuthor = getDoximityMatchedIndividual(doximityUserData, author_last_display_name);

    row = {
        ...row,
        author_first_display_name,
        author_first_edu_level,
        first_author_student,
        author_first_semantic_id,
        author_first_paper_count,
        author_first_citation_count,
        author_first_hindex,
        author_first_sex : doximityFirstAuthor[0]?.sex,
        author_first_certifications : doximityFirstAuthor[0]?.certifications,
        author_first_description : doximityFirstAuthor[0]?.description,
        author_first_summary : doximityFirstAuthor[0]?.summary && doximityFirstAuthor[0]?.summary[0],
        author_last_display_name,
        author_last_position_rank,
        author_last_education_name,
        author_last_program_id,
        author_last_affiliation_match,
        author_last_semantic_id,
        author_last_paper_count,
        author_last_citation_count,
        author_last_hindex,
        author_last_sex : doximityLastAuthor[0]?.sex,
        author_last_certifications : doximityLastAuthor[0]?.certifications,
        author_last_description : doximityLastAuthor[0]?.description,
        author_last_summary : doximityLastAuthor[0]?.summary && doximityLastAuthor[0]?.summary[0],
        author_last_THA_city,
        author_last_THA_state,
        author_last_program_setting,
        author_last_num_residents_on_duty,
        author_last_director_phd    
    }

    return row;
}

export default extractRowExport;