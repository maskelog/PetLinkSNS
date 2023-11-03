import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Container, GlobalStyle } from '../../Styles/reset.style'
import TabMenu from '../../Components/Common/TabMenu/TabMenu'
import PostList from '../../Components/Profile/PostList';
import ImageGrid from '../../Components/Profile/ImageGrid';
import {
    ProfileImage,
    ProfileUsername,
    ProfileAccountname,
    FollowInfo,
    FollowGroup,
    FollowCount,
    FollowLabel,
    ProfileIntro,
    ProfileImageContainer,
    Button,
    BtnGroup,
    ProfileContainer,
    ProfilePet,
    GenderIcon,
} from '../../Components/Profile/Profile.style';
import MyFeed from '../../Components/Profile/MyFeed';

const ProfilePage = () => {
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState(null);
    const { accountname } = useParams();
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [showFollowList, setShowFollowList] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const navigate = useNavigate();
    
    const handleFollowClick = (type) => {
        navigate(`/${type}`);
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'list' ? 'grid' : 'list');
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                let url = 'https://api.mandarin.weniv.co.kr/user/myinfo';
                
                if (accountname) { 
                    url = `https://api.mandarin.weniv.co.kr/profile/${accountname}`;
                }
    
                const response = await axios.get(url, {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : null,
                        'Content-type': 'application/json',
                    },
                });
            
                let profile;
                if (response.data.user) { // API에서 user가 있으면 (나의 프로필)
                    profile = response.data.user;
                } else if (response.data.profile) { // API에서 profile가 있으면 (사용자프로필)
                    profile = response.data.profile;
                } else {
                    throw new Error('Unexpected response format');
                }
                
                const parsedIntro = parseIntro(profile.intro);
                
                setProfileData({
                    ...profile,
                    ...parsedIntro
                });
            } catch (error) {
                setError(error);
            }
        };
    
        fetchData();
    }, [accountname]);
    
    function parseIntro(intro) {
        const tags = ['intro', 'pet', 'gender', 'birthdate', 'location'];
        const info = {};
        
        tags.forEach(tag => {
            const match = intro.match(new RegExp(`#${tag}:(.*?)(?=#|$)`));
            if (match && match[1]) {
                info[tag] = match[1].trim();
            }
        });
        
        return info;
    }
    

    if (error) {
        return <div>Error occurred: {error.message}</div>;
    }

    if (!profileData) {
        return <div>로딩...</div>;
    }
    
    // intro 정보 추출
    function Tag({ label, value }) {
        return value ? <p>{label}: {value}</p> : null;
    }
    
    function ProfileDetails({ intro }) {
        const info = parseIntro(intro);
    
        return (
            <div>
                {Object.entries(info).map(([key, value]) => <Tag key={key} label={capitalizeFirstLetter(key)} value={value} />)}
            </div>
        );
    }
    
    function parseIntro(intro) {
        const tags = ['intro', 'pet', 'gender', 'birthdate', 'location'];
        const info = {};
    
        tags.forEach(tag => {
            const match = intro.match(new RegExp(`#${tag}:(.*?)(?=#|$)`));
            if (match && match[1]) {
                info[tag] = match[1].trim();
            }
        });
    
        return info;
    }
    
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    

    // 팔로우 언팔 기능

    const handleFollow = async () => {
        try {
            const response = await axios.post(`https://api.mandarin.weniv.co.kr/profile/${profileData.accountname}/follow`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-type': 'application/json',
                },
            });
            if (response.data.profile) {
                setProfileData(prevData => ({
                    ...prevData, // 기존 데이터 유지
                    ...response.data.profile, // 새로운 데이터로 업데이트
                    isfollow: true // 팔로우 상태 업데이트
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };
    
    const handleUnfollow = async () => {
        try {
            const response = await axios.delete(`https://api.mandarin.weniv.co.kr/profile/${profileData.accountname}/unfollow`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-type': 'application/json',
                },
            });
            if (response.data.profile) {
                setProfileData(prevData => ({
                    ...prevData, // 기존 데이터 유지
                    ...response.data.profile, // 새로운 데이터로 업데이트
                    isfollow: false // 언팔로우 상태 업데이트
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    // 팔로우 팔로잉 리스트 이동
    const fetchFollowList = async (type) => { // type: 'followers' or 'following'
        try {
            const token = localStorage.getItem('token');
            const url = `https://api.mandarin.weniv.co.kr/profile/${accountname}/${type}`;
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-type': 'application/json',
                },
            });
            
            if (type === 'followers') {
                setFollowers(response.data);
            } else {
                setFollowing(response.data);
            }
            
            setShowFollowList(type);
        } catch (error) {
            console.error(error);
        }
    };

    // birthdate를 개월 또는 일자로 변환
    function calculateAge(birthdateStr) {
        const birthdate = new Date(birthdateStr);
        const today = new Date();

        let months = (today.getFullYear() - birthdate.getFullYear()) * 12;
        months -= birthdate.getMonth();
        months += today.getMonth();
        
        if (months <= 0) {
            const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            const diffDays = Math.round(Math.abs((today - birthdate) / oneDay));
            return `${diffDays}일`;
        }
        
        return `${months}개월`;
    }
    // gender 아이콘 변경
    function genderUnicode(gender) {
        return gender === '남아' ? '♂' : gender === '여아' ? '♀' : null;
    }

    return (
        <>
            <GlobalStyle />
            <Container>
                <ProfileContainer>
                    <FollowInfo>
                        <FollowGroup onClick={() => handleFollowClick('follow')}>
                            <FollowCount>{profileData.followingCount}</FollowCount>
                            <FollowLabel>Following</FollowLabel>
                        </FollowGroup>
                        
                        <ProfileImageContainer>
                            <ProfileImage src={profileData.image} alt="Profile" />
                            <ProfileUsername>{profileData.username}</ProfileUsername>
                            <ProfileAccountname>@{profileData.accountname}</ProfileAccountname>
                            <ProfilePet>
                                {profileData.gender && (
                                    <GenderIcon gender={profileData.gender}>
                                        {genderUnicode(profileData.gender)}
                                    </GenderIcon>)}
                                {profileData.pet && <span>{`${profileData.pet} `}</span>}
                                {profileData.birthdate && <span>{`${calculateAge(profileData.birthdate)} `}</span>}
                                {profileData.location && <span>{`${profileData.location} `}</span>}
                            </ProfilePet>
                        </ProfileImageContainer>
                        
                        <FollowGroup onClick={() => handleFollowClick('following')}>
                            <FollowCount>{profileData.followerCount}</FollowCount>
                            <FollowLabel>Followers</FollowLabel>
                        </FollowGroup>
                    </FollowInfo>
                    
                    {/* Button myinfo / userprofile depending on conditions */}
                    {accountname ? (
                        profileData.isfollow ? (
                            <BtnGroup style={{
                                marginRight: "10px"
                            }}>
                                <Button onClick={handleUnfollow}>언팔로우</Button>
                            </BtnGroup>
                        ) : (
                            <BtnGroup style={{
                                marginRight: "10px"
                            }}>
                                <Button onClick={handleFollow}>팔로우</Button>
                            </BtnGroup>
                        )
                    ) : (
                        <BtnGroup>
                            <Link to="/profile/edit">
                                <Button>프로필 수정</Button>
                            </Link>
                            <Link to={`/market/add-product/`}>
                                <Button>상품 등록</Button>
                            </Link>
                        </BtnGroup>
                    )}
                </ProfileContainer>
                <MyFeed accountname={profileData.accountname}/>
            </Container>
            <TabMenu />
        </>
    );
};

export default ProfilePage;